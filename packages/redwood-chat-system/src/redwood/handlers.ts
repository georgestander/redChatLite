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

      const stream = await config.runtime.sendMessage({
        threadId: payload.id,
        sessionId: payload.sessionId ?? 'anonymous',
        messageId: payload.message.id,
        message: payload.message,
        model: payload.model ?? 'gpt-4o-mini',
        providerId: payload.providerId
      });

      return new Response(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache'
        }
      });
    },

    async stream(request: Request, params: { id: string }): Promise<Response> {
      const url = new URL(request.url);
      const cursorParam = url.searchParams.get('cursor');
      const cursor = cursorParam ? Number.parseInt(cursorParam, 10) : 0;
      const stream = await config.runtime.resumeStream(params.id, Number.isNaN(cursor) ? 0 : cursor);

      if (!stream) {
        return jsonResponse({ error: 'No active stream' }, 404);
      }

      return new Response(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache'
        }
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
