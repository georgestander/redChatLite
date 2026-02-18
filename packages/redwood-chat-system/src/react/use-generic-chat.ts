import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type ChatInit, type UIMessage } from 'ai';

export interface GenericChatOptions<UI_MESSAGE extends UIMessage = UIMessage> extends Omit<ChatInit<UI_MESSAGE>, 'transport'> {
  api?: string;
  resume?: boolean;
  headers?: Record<string, string>;
  prepareRequestBody?: (input: {
    id: string;
    messages: UI_MESSAGE[];
    requestMetadata?: unknown;
  }) => Record<string, unknown>;
}

export function createGenericChatTransport<UI_MESSAGE extends UIMessage = UIMessage>(options: GenericChatOptions<UI_MESSAGE>) {
  return new DefaultChatTransport({
    api: options.api ?? '/api/chat',
    headers: options.headers,
    prepareSendMessagesRequest: ({ id, messages, requestMetadata }) => {
      const baseBody = {
        id,
        messages,
        message: messages[messages.length - 1]
      };

      return {
        body: {
          ...baseBody,
          ...(options.prepareRequestBody?.({
            id,
            messages: messages as UI_MESSAGE[],
            requestMetadata
          }) ?? {})
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

export function useGenericChat<UI_MESSAGE extends UIMessage = UIMessage>(options: GenericChatOptions<UI_MESSAGE>) {
  return useChat({
    id: options.id,
    messages: options.messages,
    onError: options.onError,
    onToolCall: options.onToolCall,
    onFinish: options.onFinish,
    onData: options.onData,
    sendAutomaticallyWhen: options.sendAutomaticallyWhen,
    dataPartSchemas: options.dataPartSchemas,
    messageMetadataSchema: options.messageMetadataSchema,
    generateId: options.generateId,
    resume: options.resume ?? true,
    transport: createGenericChatTransport(options)
  });
}
