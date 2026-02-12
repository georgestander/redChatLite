import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  delete (globalThis as { CHAT_R2_BUCKET?: unknown }).CHAT_R2_BUCKET;
});

describe('r2 binding regression', () => {
  it('uses CHAT_R2_BUCKET binding for attachment uploads when present', async () => {
    const put = vi.fn(async () => ({ ok: true }));
    const del = vi.fn(async () => ({ ok: true }));

    (globalThis as { CHAT_R2_BUCKET?: unknown }).CHAT_R2_BUCKET = {
      put,
      delete: del
    };

    const modulePath = `../../../apps/redwood-demo/api/src/lib/chat-system.ts?test=${Date.now()}`;
    const { handlers } = await import(modulePath);

    const response = await handlers.attachments(
      new Request('http://localhost/api/chat/attachments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          threadId: 'thread-r2',
          name: 'asset.png',
          mimeType: 'image/png',
          dataBase64: Buffer.from('abc').toString('base64')
        })
      })
    );

    expect(response.status).toBe(200);
    expect(put).toHaveBeenCalledOnce();
    expect(del).toHaveBeenCalledTimes(0);
  });
});
