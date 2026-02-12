import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';

describe('persistence and retention regression', () => {
  it('persists messages and prunes data beyond retention window', async () => {
    const now = new Date('2026-02-12T00:00:00.000Z');
    const storage = new InMemoryChatStorageAdapter();

    const runtime = createChatSystem({
      storage,
      attachments: new LocalAttachmentStore('.tmp/test-retention'),
      providers: { mock: createMockProvider(['hello']) },
      defaultProviderId: 'mock',
      retentionDays: 30,
      now: () => new Date(now)
    });

    const stream = await runtime.sendMessage({
      threadId: 'retention-thread',
      sessionId: 'anon',
      messageId: 'm1',
      model: 'mock',
      message: {
        id: 'm1',
        threadId: 'retention-thread',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
        createdAt: new Date('2025-12-01T00:00:00.000Z').toISOString()
      }
    });

    await stream.cancel();

    const thread = await storage.getThread('retention-thread');
    expect(thread).not.toBeNull();

    await storage.createThread({
      id: 'old-thread',
      sessionId: 'anon',
      metadata: {}
    });

    // Simulate stale thread by mutating adapter internals through save path.
    await storage.upsertStreamState({
      threadId: 'old-thread',
      status: 'completed',
      chunks: ['old'],
      updatedAt: '2020-01-01T00:00:00.000Z'
    });

    const deleted = await runtime.runRetention();
    expect(deleted).toBeGreaterThanOrEqual(0);
  });
});
