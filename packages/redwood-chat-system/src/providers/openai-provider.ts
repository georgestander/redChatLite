import { type ChatMessage, type ChatProviderAdapter, type ChatProviderStreamEvent, type ChatProviderStreamRequest } from '../core/types.js';
import { type OpenAICompatibleConfig } from './types.js';

function partToPromptText(part: ChatMessage['parts'][number]): string {
  switch (part.type) {
    case 'text':
    case 'reasoning':
      return part.text;
    case 'attachment':
      return part.name ? `[attachment:${part.name}]` : '[attachment]';
    case 'file':
      return part.name ? `[file:${part.name}]` : `[file:${part.mediaType}]`;
    case 'source-url':
      return part.title ? `[source:${part.title}]` : `[source:${part.url}]`;
    case 'source-document':
      return `[source-document:${part.title}]`;
    case 'tool':
      return `[tool:${part.toolName}:${part.state}]`;
    case 'data':
      return `[data:${part.name}]`;
    default:
      return '';
  }
}

function toPrompt(messages: ChatMessage[]): string {
  return messages
    .map((message) => `${message.role}: ${message.parts.map((part) => partToPromptText(part)).join(' ')}`)
    .join('\n');
}

function toProviderMessages(messages: ChatMessage[]) {
  const mapped = messages
    .map((message) => {
      const content = message.parts
        .map((part) => partToPromptText(part))
        .filter(Boolean)
        .join('\n')
        .trim();
      if (!content) {
        return null;
      }

      return {
        role: message.role,
        content
      };
    })
    .filter((message): message is { role: 'system' | 'user' | 'assistant'; content: string } => message !== null);

  if (mapped.length === 0) {
    return [{ role: 'user', content: toPrompt(messages) }];
  }

  return mapped;
}

async function* streamCompletion(
  config: OpenAICompatibleConfig,
  request: ChatProviderStreamRequest
): AsyncGenerator<ChatProviderStreamEvent> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: request.model || config.model,
      stream: true,
      messages: toProviderMessages(request.messages)
    }),
    signal: request.signal
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Provider request failed (${response.status}): ${payload}`);
  }

  if (!response.body) {
    throw new Error('Provider returned no response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }

    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) {
        continue;
      }

      const payload = line.slice('data:'.length).trim();
      if (!payload) {
        continue;
      }

      if (payload === '[DONE]') {
        yield { type: 'done' };
        return;
      }

      try {
        const event = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
          error?: { message?: string };
        };

        if (event.error?.message) {
          yield { type: 'error', error: event.error.message };
          continue;
        }

        const delta = event.choices?.[0]?.delta?.content;
        if (delta) {
          yield { type: 'delta', text: delta };
        }
      } catch {
        continue;
      }
    }
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
      yield* streamCompletion(normalized, request);
    }
  };
}
