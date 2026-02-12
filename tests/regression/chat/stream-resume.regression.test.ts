import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';

async function collect(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = '';
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    out += decoder.decode(item.value, { stream: true });
  }
  return out;
}

describe('stream resume regression', () => {
  it('replays remaining chunks from stored stream state', async () => {
    const runtime = createChatSystem({
      storage: new InMemoryChatStorageAdapter(),
      attachments: new LocalAttachmentStore('.tmp/test-resume'),
      providers: { mock: createMockProvider(['a', 'b', 'c']) },
      defaultProviderId: 'mock'
    });

    const first = await runtime.sendMessage({
      threadId: 'resume-thread',
      sessionId: 'anon',
      messageId: 'm1',
      model: 'mock',
      message: {
        id: 'm1',
        threadId: 'resume-thread',
        role: 'user',
        parts: [{ type: 'text', text: 'yo' }],
        createdAt: new Date().toISOString()
      }
    });

    await collect(first);

    const resumed = await runtime.resumeStream('resume-thread', 1);
    expect(resumed).not.toBeNull();
    const output = await collect(resumed as ReadableStream<Uint8Array>);
    expect(output).toContain('"text":"b"');
    expect(output).toContain('"text":"c"');
  });
});
