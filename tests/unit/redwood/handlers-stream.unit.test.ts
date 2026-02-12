import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import type { ChatMessage } from '../../../packages/redwood-chat-system/src/core/types.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';
import { createRedwoodChatHandlers } from '../../../packages/redwood-chat-system/src/redwood/handlers.js';

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let out = '';
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    out += decoder.decode(chunk.value, { stream: true });
  }
  return out;
}

describe('redwood stream handlers', () => {
  it('streams chat responses and supports resume endpoint', async () => {
    const runtime = createChatSystem({
      storage: new InMemoryChatStorageAdapter(),
      attachments: new LocalAttachmentStore('.tmp/test-attachments'),
      providers: { mock: createMockProvider(['A', 'B', 'C']) },
      defaultProviderId: 'mock'
    });

    const handlers = createRedwoodChatHandlers({ runtime });

    const message: ChatMessage = {
      id: 'm1',
      threadId: 'thread-1',
      role: 'user',
      parts: [{ type: 'text', text: 'hello' }],
      createdAt: new Date().toISOString()
    };

    const response = await handlers.chat(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'thread-1', sessionId: 'anon', model: 'mock', message })
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const output = await readStream(response.body as ReadableStream<Uint8Array>);
    expect(output).toContain('"type":"text-start"');
    expect(output).toContain('"type":"text-delta"');
    expect(output).toContain('"type":"text-end"');

    const resume = await handlers.stream(new Request('http://localhost/api/chat/thread-1/stream?cursor=1'), {
      id: 'thread-1'
    });
    expect(resume.status).toBe(200);
    const resumed = await readStream(resume.body as ReadableStream<Uint8Array>);
    expect(resumed).toContain('"type":"text-delta"');
  });
});
