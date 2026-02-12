import { describe, expect, it, vi } from 'vitest';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { R2AttachmentStore, type R2BucketLike } from '../../../packages/redwood-chat-system/src/attachments/r2-store.js';

describe('r2 attachment store', () => {
  it('stores in R2 when bucket put succeeds', async () => {
    const bucket: R2BucketLike = {
      put: vi.fn(async () => ({ ok: true })),
      delete: vi.fn(async () => ({ ok: true }))
    };

    const store = new R2AttachmentStore(bucket, { publicBaseUrl: 'https://files.example.com' });
    const attachment = await store.upload({
      threadId: 'thread-a',
      name: 'image.png',
      mimeType: 'image/png',
      data: new Uint8Array([1, 2, 3])
    });

    expect(bucket.put).toHaveBeenCalledOnce();
    expect(attachment.url.startsWith('https://files.example.com/')).toBe(true);
    expect(attachment.mimeType).toBe('image/png');
  });

  it('falls back to local store when R2 upload fails', async () => {
    const bucket: R2BucketLike = {
      put: vi.fn(async () => {
        throw new Error('boom');
      }),
      delete: vi.fn(async () => ({ ok: true }))
    };

    const fallback = new LocalAttachmentStore('.tmp/test-r2-fallback');
    const store = new R2AttachmentStore(bucket, { fallbackStore: fallback });

    const attachment = await store.upload({
      threadId: 'thread-b',
      name: 'doc.pdf',
      mimeType: 'application/pdf',
      data: new Uint8Array([4, 5, 6])
    });

    expect(bucket.put).toHaveBeenCalledOnce();
    expect(attachment.url.startsWith('/local-attachments/')).toBe(true);
  });
});
