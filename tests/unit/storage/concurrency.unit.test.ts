import { describe, expect, it } from 'vitest';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';

describe('storage concurrency', () => {
  it('handles concurrent writes to the same thread', async () => {
    const storage = new InMemoryChatStorageAdapter();
    await storage.createThread({ id: 't-concurrent', sessionId: 'anon', metadata: {} });

    await Promise.all(
      Array.from({ length: 10 }).map((_, index) =>
        storage.saveMessage({
          id: `m-${index}`,
          threadId: 't-concurrent',
          role: 'user',
          parts: [{ type: 'text', text: `value-${index}` }],
          createdAt: new Date().toISOString()
        })
      )
    );

    const messages = await storage.listMessages('t-concurrent');
    expect(messages).toHaveLength(10);
  });
});
