import { describe, expect, it } from 'vitest';
import { createGenericChatTransport } from '../../../packages/redwood-chat-system/src/react/use-generic-chat.js';

describe('createGenericChatTransport', () => {
  it('configures send + resume request shaping', async () => {
    const transport = createGenericChatTransport({
      id: 'chat-123',
      api: '/api/chat',
      resume: true,
      headers: { Authorization: 'Bearer x' }
    }) as {
      prepareSendMessagesRequest: (input: { id: string; messages: Array<{ id: string }> }) => Promise<{
        body: { id: string; message: { id: string } };
      }>;
      prepareReconnectToStreamRequest: (input: { id: string }) => Promise<{ api: string }>;
    };

    const sendPayload = await transport.prepareSendMessagesRequest({
      id: 'chat-123',
      messages: [{ id: 'm1' }]
    });

    expect(sendPayload.body.id).toBe('chat-123');
    expect(sendPayload.body.message.id).toBe('m1');

    const reconnectPayload = await transport.prepareReconnectToStreamRequest({ id: 'chat-123' });
    expect(reconnectPayload.api).toBe('/api/chat/chat-123/stream');
  });
});
