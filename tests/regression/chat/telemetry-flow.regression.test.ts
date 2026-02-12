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

describe('telemetry flow regression', () => {
  it('emits ordered event names across send/complete/upload', async () => {
    const names: string[] = [];
    const runtime = createChatSystem({
      storage: new InMemoryChatStorageAdapter(),
      attachments: new LocalAttachmentStore('.tmp/test-telemetry-regression'),
      providers: { mock: createMockProvider(['x', 'y']) },
      defaultProviderId: 'mock',
      emitTelemetry: (event) => {
        names.push(event.name);
      }
    });

    const stream = await runtime.sendMessage({
      threadId: 'telemetry-regression-thread',
      sessionId: 'anon',
      messageId: 'm1',
      model: 'mock',
      message: {
        id: 'm1',
        threadId: 'telemetry-regression-thread',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
        createdAt: new Date().toISOString()
      }
    });

    await drain(stream);

    await runtime.uploadAttachment({
      threadId: 'telemetry-regression-thread',
      name: 'img.png',
      mimeType: 'image/png',
      data: new Uint8Array([0, 1, 2, 3])
    });

    expect(names[0]).toBe('message.saved');
    expect(names).toContain('stream.completed');
    expect(names[names.length - 1]).toBe('attachment.uploaded');
  });
});
