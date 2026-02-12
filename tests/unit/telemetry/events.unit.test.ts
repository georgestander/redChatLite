import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';

describe('telemetry events', () => {
  it('emits deterministic events for send/upload', async () => {
    const events: string[] = [];

    const runtime = createChatSystem({
      storage: new InMemoryChatStorageAdapter(),
      attachments: new LocalAttachmentStore('.tmp/test-telemetry'),
      providers: { mock: createMockProvider(['token']) },
      defaultProviderId: 'mock',
      emitTelemetry: (event) => {
        events.push(event.name);
      }
    });

    const stream = await runtime.sendMessage({
      threadId: 'telemetry-thread',
      sessionId: 'anon',
      messageId: 'msg-1',
      model: 'mock',
      message: {
        id: 'msg-1',
        threadId: 'telemetry-thread',
        role: 'user',
        parts: [{ type: 'text', text: 'ping' }],
        createdAt: new Date().toISOString()
      }
    });

    const reader = stream.getReader();
    while (!(await reader.read()).done) {
      // consume stream to completion so stream.completed telemetry is emitted
    }

    await runtime.uploadAttachment({
      threadId: 'telemetry-thread',
      name: 'x.png',
      mimeType: 'image/png',
      data: new Uint8Array([1, 2, 3])
    });

    expect(events).toContain('message.saved');
    expect(events).toContain('stream.completed');
    expect(events).toContain('attachment.uploaded');
  });
});
