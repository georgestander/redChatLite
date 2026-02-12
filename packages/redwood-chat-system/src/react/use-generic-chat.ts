import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';

export interface GenericChatOptions {
  id: string;
  api?: string;
  resume?: boolean;
  messages?: UIMessage[];
  headers?: Record<string, string>;
}

export function createGenericChatTransport(options: GenericChatOptions) {
  return new DefaultChatTransport({
    api: options.api ?? '/api/chat',
    headers: options.headers,
    prepareSendMessagesRequest: ({ id, messages }) => {
      return {
        body: {
          id,
          message: messages[messages.length - 1]
        }
      };
    },
    prepareReconnectToStreamRequest: ({ id }) => {
      return {
        api: `/api/chat/${id}/stream`,
        headers: options.headers
      };
    }
  });
}

export function useGenericChat(options: GenericChatOptions) {
  return useChat({
    id: options.id,
    messages: options.messages,
    resume: options.resume ?? true,
    transport: createGenericChatTransport(options)
  });
}
