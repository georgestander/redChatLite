import { describe, expect, it } from 'vitest';
import { D1ChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/d1-storage.js';

describe('d1 storage adapter', () => {
  it('persists threads, messages, stream state, and attachments', async () => {
    const storage = new D1ChatStorageAdapter();
    const thread = await storage.createThread({ id: 't1', sessionId: 'anon', metadata: { env: 'test' } });
    expect(thread.id).toBe('t1');

    await storage.saveMessage({
      id: 'm1',
      threadId: 't1',
      role: 'user',
      parts: [{ type: 'text', text: 'hello' }],
      createdAt: new Date().toISOString()
    });

    const messages = await storage.listMessages('t1');
    expect(messages).toHaveLength(1);

    await storage.upsertStreamState({
      threadId: 't1',
      status: 'active',
      chunks: ['hello'],
      updatedAt: new Date().toISOString()
    });

    const state = await storage.getStreamState('t1');
    expect(state?.status).toBe('active');

    await storage.saveAttachment({
      id: 'a1',
      threadId: 't1',
      name: 'x.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
      key: 'k',
      url: 'u',
      createdAt: new Date().toISOString()
    });

    const attachment = await storage.getAttachment('a1');
    expect(attachment?.id).toBe('a1');
  });
});
