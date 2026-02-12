import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { createRedwoodChatHandlers } from '../../../packages/redwood-chat-system/src/redwood/handlers.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';

describe('attachments regression', () => {
  it('uploads json payload attachment and returns metadata', async () => {
    const runtime = createChatSystem({
      storage: new InMemoryChatStorageAdapter(),
      attachments: new LocalAttachmentStore('.tmp/test-attachments-regression'),
      providers: { mock: createMockProvider() },
      defaultProviderId: 'mock'
    });

    const handlers = createRedwoodChatHandlers({ runtime });
    const body = {
      threadId: 't-attach',
      name: 'sample.pdf',
      mimeType: 'application/pdf',
      dataBase64: Buffer.from('hello').toString('base64')
    };

    const response = await handlers.attachments(
      new Request('http://localhost/api/chat/attachments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { attachment: { mimeType: string; sizeBytes: number } };
    expect(payload.attachment.mimeType).toBe('application/pdf');
    expect(payload.attachment.sizeBytes).toBe(5);
  });
});
