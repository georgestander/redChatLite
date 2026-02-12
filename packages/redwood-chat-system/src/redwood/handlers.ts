import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { createChatSystem } from '../core/chat-system.js';
import { type ChatMessage, type ChatSystemConfig } from '../core/types.js';
import { type RedwoodChatHandlerConfig, type RedwoodChatHandlers } from './types.js';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

export function createRedwoodChatHandlers(config: RedwoodChatHandlerConfig): RedwoodChatHandlers {
  return {
    async chat(request: Request): Promise<Response> {
      const payload = (await request.json()) as {
        id: string;
        sessionId?: string;
        model?: string;
        providerId?: string;
        message: ChatMessage;
      };

      if (!payload?.id || !payload?.message) {
        return jsonResponse({ error: 'Invalid request payload' }, 400);
      }

      const runtimeStream = await config.runtime.sendMessage({
        threadId: payload.id,
        sessionId: payload.sessionId ?? 'anonymous',
        messageId: payload.message.id,
        message: payload.message,
        model: payload.model ?? 'gpt-4o-mini',
        providerId: payload.providerId
      });

      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const textId = `assistant-${payload.id}-${Date.now()}`;
            writer.write({ type: 'text-start', id: textId });

            await consumeRuntimeStream(runtimeStream, (event) => {
              if (event.type === 'delta' && typeof event.text === 'string') {
                writer.write({ type: 'text-delta', id: textId, delta: event.text });
              }

              if (event.type === 'error') {
                writer.write({
                  type: 'data-error',
                  data: { message: event.error ?? 'stream_error' },
                  transient: true
                });
              }
            });

            writer.write({ type: 'text-end', id: textId });
          }
        })
      });
    },

    async stream(request: Request, params: { id: string }): Promise<Response> {
      const url = new URL(request.url);
      const cursorParam = url.searchParams.get('cursor');
      const cursor = cursorParam ? Number.parseInt(cursorParam, 10) : 0;
      const runtimeStream = await config.runtime.resumeStream(
        params.id,
        Number.isNaN(cursor) ? 0 : cursor
      );

      if (!runtimeStream) {
        return jsonResponse({ error: 'No active stream' }, 404);
      }

      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const textId = `assistant-resume-${params.id}-${Date.now()}`;
            writer.write({ type: 'text-start', id: textId });

            await consumeRuntimeStream(runtimeStream, (event) => {
              if (event.type === 'delta' && typeof event.text === 'string') {
                writer.write({ type: 'text-delta', id: textId, delta: event.text });
              }
            });

            writer.write({ type: 'text-end', id: textId });
          }
        })
      });
    },

    async attachments(request: Request): Promise<Response> {
      const contentType = request.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const body = (await request.json()) as {
          threadId: string;
          messageId?: string;
          name: string;
          mimeType: string;
          dataBase64: string;
        };

        const bytes = Uint8Array.from(Buffer.from(body.dataBase64, 'base64'));
        const attachment = await config.runtime.uploadAttachment({
          threadId: body.threadId,
          messageId: body.messageId,
          name: body.name,
          mimeType: body.mimeType,
          data: bytes
        });
        return jsonResponse({ attachment });
      }

      const formData = await request.formData();
      const file = formData.get('file');
      const threadId = String(formData.get('threadId') ?? '');
      const messageId = formData.get('messageId');

      if (!(file instanceof File) || !threadId) {
        return jsonResponse({ error: 'Invalid attachment payload' }, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const attachment = await config.runtime.uploadAttachment({
        threadId,
        messageId: typeof messageId === 'string' ? messageId : undefined,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: new Uint8Array(arrayBuffer)
      });
      return jsonResponse({ attachment });
    }
  };
}

export function createRedwoodRuntime(config: ChatSystemConfig) {
  return createChatSystem(config);
}

interface RuntimeStreamEvent {
  type?: string;
  text?: string;
  error?: string;
}

async function consumeRuntimeStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: RuntimeStreamEvent) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }

    buffer += decoder.decode(chunk.value, { stream: true });
    const packets = buffer.split('\n\n');
    buffer = packets.pop() ?? '';

    for (const packet of packets) {
      const dataLine = packet
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('data:'));

      if (!dataLine) {
        continue;
      }

      const payload = dataLine.slice('data:'.length).trim();
      if (!payload) {
        continue;
      }

      try {
        onEvent(JSON.parse(payload) as RuntimeStreamEvent);
      } catch {
        onEvent({ type: 'error', error: 'invalid_stream_payload' });
      }
    }
  }
}
