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
        message?: unknown;
        messages?: unknown[];
      };

      if (!payload?.id) {
        return jsonResponse({ error: 'Invalid request payload' }, 400);
      }

      const normalizedMessage = normalizeIncomingMessage(
        payload.id,
        payload.message ?? payload.messages?.[payload.messages.length - 1]
      );
      if (!normalizedMessage) {
        return jsonResponse({ error: 'Missing message payload' }, 400);
      }

      const runtimeStream = await config.runtime.sendMessage({
        threadId: payload.id,
        sessionId: payload.sessionId ?? 'anonymous',
        messageId: normalizedMessage.id,
        message: normalizedMessage,
        model: payload.model ?? 'gpt-4o-mini',
        providerId: payload.providerId,
        signal: request.signal
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
  name?: string;
  data?: unknown;
  toolCallId?: string;
  toolName?: string;
  state?: 'input-available' | 'output-available' | 'output-error';
  output?: unknown;
  input?: unknown;
  url?: string;
  title?: string;
  sourceId?: string;
  mediaType?: string;
  filename?: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRole(value: unknown): value is ChatMessage['role'] {
  return value === 'system' || value === 'user' || value === 'assistant';
}

function normalizeIncomingMessage(threadId: string, input: unknown): ChatMessage | null {
  if (!isRecord(input)) {
    return null;
  }

  const incomingParts = Array.isArray(input.parts) ? input.parts : [];
  const normalizedParts = incomingParts
    .map((part) => normalizeIncomingPart(part))
    .filter((part): part is ChatMessage['parts'][number] => part !== null);

  if (normalizedParts.length === 0) {
    return null;
  }

  const role = isRole(input.role) ? input.role : 'user';
  const id = typeof input.id === 'string' ? input.id : `${threadId}-${Date.now()}`;
  const createdAt = typeof input.createdAt === 'string' ? input.createdAt : new Date().toISOString();
  const metadata = isRecord(input.metadata) ? input.metadata : undefined;
  const providerId = typeof input.providerId === 'string' ? input.providerId : undefined;
  const model = typeof input.model === 'string' ? input.model : undefined;

  return {
    id,
    threadId,
    role,
    parts: normalizedParts,
    createdAt,
    metadata,
    providerId,
    model
  };
}

function normalizeIncomingPart(input: unknown): ChatMessage['parts'][number] | null {
  if (!isRecord(input) || typeof input.type !== 'string') {
    return null;
  }

  switch (input.type) {
    case 'text':
      return typeof input.text === 'string' ? { type: 'text', text: input.text } : null;
    case 'reasoning':
      return typeof input.text === 'string' ? { type: 'reasoning', text: input.text } : null;
    case 'attachment':
      return {
        type: 'attachment',
        attachmentId: typeof input.attachmentId === 'string' ? input.attachmentId : undefined,
        url: typeof input.url === 'string' ? input.url : undefined,
        mimeType: typeof input.mimeType === 'string' ? input.mimeType : undefined,
        name: typeof input.name === 'string' ? input.name : undefined,
        sizeBytes: typeof input.sizeBytes === 'number' ? input.sizeBytes : undefined
      };
    case 'file':
      if (typeof input.url !== 'string' || typeof input.mediaType !== 'string') {
        return null;
      }
      return {
        type: 'file',
        url: input.url,
        mediaType: input.mediaType,
        name: typeof input.filename === 'string' ? input.filename : undefined
      };
    case 'source-url':
      if (typeof input.sourceId !== 'string' || typeof input.url !== 'string') {
        return null;
      }
      return {
        type: 'source-url',
        sourceId: input.sourceId,
        url: input.url,
        title: typeof input.title === 'string' ? input.title : undefined
      };
    case 'source-document':
      if (
        typeof input.sourceId !== 'string' ||
        typeof input.title !== 'string' ||
        typeof input.mediaType !== 'string'
      ) {
        return null;
      }
      return {
        type: 'source-document',
        sourceId: input.sourceId,
        title: input.title,
        mediaType: input.mediaType,
        filename: typeof input.filename === 'string' ? input.filename : undefined,
        url: typeof input.url === 'string' ? input.url : undefined
      };
    case 'dynamic-tool':
      if (typeof input.toolCallId !== 'string' || typeof input.toolName !== 'string' || typeof input.state !== 'string') {
        return null;
      }
      return {
        type: 'tool',
        toolCallId: input.toolCallId,
        toolName: input.toolName,
        state: input.state === 'output-error' ? 'output-error' : input.state === 'output-available' ? 'output-available' : 'input-available',
        input: input.input,
        output: input.output,
        errorText: typeof input.errorText === 'string' ? input.errorText : undefined
      };
    default:
      if (input.type.startsWith('tool-')) {
        if (typeof input.toolCallId !== 'string') {
          return null;
        }
        return {
          type: 'tool',
          toolCallId: input.toolCallId,
          toolName: input.type.slice('tool-'.length),
          state:
            input.state === 'output-error'
              ? 'output-error'
              : input.state === 'output-available'
                ? 'output-available'
                : 'input-available',
          input: input.input,
          output: input.output,
          errorText: typeof input.errorText === 'string' ? input.errorText : undefined
        };
      }

      if (input.type.startsWith('data-')) {
        return {
          type: 'data',
          name: input.type.slice('data-'.length),
          data: input.data
        };
      }
      return null;
  }
}
