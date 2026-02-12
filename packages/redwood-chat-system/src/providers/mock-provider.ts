import { type ChatProviderAdapter, type ChatProviderStreamEvent, type ChatProviderStreamRequest } from '../core/types.js';

export function createMockProvider(chunks: string[] = ['ok']): ChatProviderAdapter {
  return {
    id: 'mock',
    supportsAttachments: true,
    async *stream(_request: ChatProviderStreamRequest): AsyncGenerator<ChatProviderStreamEvent> {
      for (const chunk of chunks) {
        yield { type: 'delta', text: chunk };
      }
      yield { type: 'done' };
    }
  };
}
