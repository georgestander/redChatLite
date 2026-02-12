import { describe, expect, it } from 'vitest';
import { createChatSystem } from '../../../packages/redwood-chat-system/src/core/chat-system.js';
import { LocalAttachmentStore } from '../../../packages/redwood-chat-system/src/attachments/local-store.js';
import { createMockProvider } from '../../../packages/redwood-chat-system/src/providers/mock-provider.js';
import { InMemoryChatStorageAdapter } from '../../../packages/redwood-chat-system/src/storage/in-memory-storage.js';

async function streamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    output += decoder.decode(chunk.value, { stream: true });
  }

  return output;
}

describe('provider swap regression', () => {
  it('changes behavior by provider config only', async () => {
    const runtime = createChatSystem({
      storage: new InMemoryChatStorageAdapter(),
      attachments: new LocalAttachmentStore('.tmp/test-provider-swap'),
      providers: {
        openai: createMockProvider(['from-openai']),
        openrouter: createMockProvider(['from-openrouter'])
      },
      defaultProviderId: 'openai'
    });

    const openaiStream = await runtime.sendMessage({
      threadId: 'provider-thread',
      sessionId: 'anon',
      messageId: 'msg-1',
      model: 'test-model',
      providerId: 'openai',
      message: {
        id: 'msg-1',
        threadId: 'provider-thread',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
        createdAt: new Date().toISOString()
      }
    });

    const openrouterStream = await runtime.sendMessage({
      threadId: 'provider-thread-2',
      sessionId: 'anon',
      messageId: 'msg-2',
      model: 'test-model',
      providerId: 'openrouter',
      message: {
        id: 'msg-2',
        threadId: 'provider-thread-2',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
        createdAt: new Date().toISOString()
      }
    });

    const outputA = await streamText(openaiStream);
    const outputB = await streamText(openrouterStream);

    expect(outputA).toContain('from-openai');
    expect(outputB).toContain('from-openrouter');
  });
});
