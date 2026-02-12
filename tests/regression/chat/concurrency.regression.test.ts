import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';

async function drain(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  while (!(await reader.read()).done) {
    // noop
  }
}

describe('concurrency regression', () => {
  it('supports parallel sends without dropping messages', async () => {
    const storage = new InMemoryChatStorageAdapter();
    const runtime = createChatSystem({
      storage,
      attachments: new LocalAttachmentStore('.tmp/test-concurrency'),
      providers: { mock: createMockProvider(['ok']) },
      defaultProviderId: 'mock'
    });

    await Promise.all(
      ['1', '2', '3', '4', '5'].map(async (id) => {
        const stream = await runtime.sendMessage({
          threadId: 'parallel-thread',
          sessionId: 'anon',
          messageId: `m-${id}`,
          model: 'mock',
          message: {
            id: `m-${id}`,
            threadId: 'parallel-thread',
            role: 'user',
            parts: [{ type: 'text', text: `hello-${id}` }],
            createdAt: new Date().toISOString()
          }
        });
        await drain(stream);
      })
    );

    const messages = await storage.listMessages('parallel-thread');
    expect(messages.length).toBeGreaterThanOrEqual(10);
  });
});
