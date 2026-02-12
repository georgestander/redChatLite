import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';

describe('provider latency regression', () => {
  it('emits first stream chunk in under 2 seconds for baseline prompt path', async () => {
    const runtime = createChatSystem({
      storage: new InMemoryChatStorageAdapter(),
      attachments: new LocalAttachmentStore('.tmp/test-provider-latency'),
      providers: { mock: createMockProvider(['fast']) },
      defaultProviderId: 'mock'
    });

    const stream = await runtime.sendMessage({
      threadId: 'latency-thread',
      sessionId: 'anon',
      messageId: 'm-latency',
      model: 'mock',
      message: {
        id: 'm-latency',
        threadId: 'latency-thread',
        role: 'user',
        parts: [{ type: 'text', text: 'hello latency' }],
        createdAt: new Date().toISOString()
      }
    });

    const startedAt = performance.now();
    const reader = stream.getReader();
    const firstChunk = await reader.read();
    const elapsedMs = performance.now() - startedAt;

    expect(firstChunk.done).toBe(false);
    expect(elapsedMs).toBeLessThan(2000);
  });
});
