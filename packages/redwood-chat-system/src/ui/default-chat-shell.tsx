import React from 'react';

export interface DefaultChatShellMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
}

export interface DefaultChatShellProps {
  title?: string;
  messages: DefaultChatShellMessage[];
}

export function DefaultChatShell(props: DefaultChatShellProps) {
  return (
    <section aria-label="chat-shell" style={{ border: '1px solid #d0d0d0', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>{props.title ?? 'Redwood Chat'}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {props.messages.map((message) => (
          <li key={message.id} style={{ marginBottom: 8 }}>
            <strong>{message.role}</strong>: {message.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
