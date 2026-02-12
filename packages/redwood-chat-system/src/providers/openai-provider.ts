import { type ChatMessage, type ChatProviderAdapter, type ChatProviderStreamEvent, type ChatProviderStreamRequest } from '../core/types.js';
import { type OpenAICompatibleConfig } from './types.js';

function toPrompt(messages: ChatMessage[]): string {
  return messages
    .map((message) => `${message.role}: ${message.parts.map((part) => part.text ?? '').join('')}`)
    .join('\n');
}

async function fetchCompletion(config: OpenAICompatibleConfig, prompt: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      messages: [{ role: 'user', content: prompt }]
    }),
    signal
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Provider request failed (${response.status}): ${payload}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content ?? '';
}

async function* chunkText(text: string): AsyncGenerator<ChatProviderStreamEvent> {
  if (!text) {
    yield { type: 'done' };
    return;
  }

  const words = text.split(/(\s+)/).filter(Boolean);
  for (const word of words) {
    yield { type: 'delta', text: word };
  }
  yield { type: 'done' };
}

export function createOpenAIProvider(config: Omit<OpenAICompatibleConfig, 'baseUrl'> & { baseUrl?: string }): ChatProviderAdapter {
  const normalized: OpenAICompatibleConfig = {
    ...config,
    baseUrl: config.baseUrl ?? 'https://api.openai.com/v1'
  };

  return {
    id: 'openai',
    supportsAttachments: true,
    async *stream(request: ChatProviderStreamRequest): AsyncGenerator<ChatProviderStreamEvent> {
      const prompt = toPrompt(request.messages);
      const text = await fetchCompletion(normalized, prompt, request.signal);
      for await (const chunk of chunkText(text)) {
        yield chunk;
      }
    }
  };
}
