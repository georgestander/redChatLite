import React from 'react';
import { useGenericChat } from '@redwood-chat/system/react';
import { DefaultChatShell } from '@redwood-chat/system/ui';

export function ChatPage() {
  const [draft, setDraft] = React.useState('');
  const { messages, sendMessage, status } = useGenericChat({
    id: 'redwood-demo-chat',
    api: '/api/chat',
    resume: true
  }) as {
    messages: Array<{ id: string; role: 'user' | 'assistant' | 'system'; parts?: Array<{ type?: string; text?: string }> }>;
    sendMessage: (message: { text: string }) => Promise<void>;
    status: string;
  };

  const shellMessages = messages.map((message) => ({
    id: message.id,
    role: message.role,
    text:
      message.parts?.find((part) => part.type === 'text')?.text ??
      message.parts?.[0]?.text ??
      ''
  }));

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next) {
      return;
    }

    await sendMessage({ text: next });
    setDraft('');
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <DefaultChatShell title={`RedwoodChat Demo (${status})`} messages={shellMessages} />
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <label htmlFor="chat-input">Message</label>
        <input
          id="chat-input"
          name="chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask something..."
        />
        <button type="submit" disabled={status === 'streaming'}>
          Send
        </button>
      </form>
    </div>
  );
}
