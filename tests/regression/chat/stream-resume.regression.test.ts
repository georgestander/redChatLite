import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';
import { type ChatProviderAdapter, type ChatProviderStreamEvent, type ChatProviderStreamRequest } from '../../../packages/redwood-chat-system/src/core/types.js';

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

  it('continues active streams when resume is requested before completion', async () => {
    const slowProvider: ChatProviderAdapter = {
      id: 'slow-mock',
      supportsAttachments: true,
      async *stream(_request: ChatProviderStreamRequest): AsyncGenerator<ChatProviderStreamEvent> {
        yield { type: 'delta', text: 'a' };
        await new Promise((resolve) => setTimeout(resolve, 40));
        yield { type: 'delta', text: 'b' };
        await new Promise((resolve) => setTimeout(resolve, 40));
        yield { type: 'delta', text: 'c' };
        yield { type: 'done' };
      }
    };

    const runtime = createChatSystem({
      storage: new InMemoryChatStorageAdapter(),
      attachments: new LocalAttachmentStore('.tmp/test-resume-live'),
      providers: { slow: slowProvider },
      defaultProviderId: 'slow'
    });

    const active = await runtime.sendMessage({
      threadId: 'resume-live-thread',
      sessionId: 'anon',
      messageId: 'm-live',
      model: 'slow',
      providerId: 'slow',
      message: {
        id: 'm-live',
        threadId: 'resume-live-thread',
        role: 'user',
        parts: [{ type: 'text', text: 'yo live' }],
        createdAt: new Date().toISOString()
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const resumed = await runtime.resumeStream('resume-live-thread', 1);
    expect(resumed).not.toBeNull();

    const [primaryOutput, resumedOutput] = await Promise.all([
      collect(active),
      collect(resumed as ReadableStream<Uint8Array>)
    ]);

    expect(primaryOutput).toContain('"text":"a"');
    expect(primaryOutput).toContain('"text":"b"');
    expect(primaryOutput).toContain('"text":"c"');
    expect(resumedOutput).toContain('"text":"b"');
    expect(resumedOutput).toContain('"text":"c"');
    expect(resumedOutput).toContain('"type":"done"');
  });
});
