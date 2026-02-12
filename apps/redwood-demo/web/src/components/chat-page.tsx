import React from 'react';
import { DefaultChatShell } from '@redwood-chat/system/ui';

export function ChatPage() {
  return (
    <DefaultChatShell
      title="RedwoodChat Demo"
      messages={[
        { id: '1', role: 'assistant', text: 'Demo shell is wired.' },
        { id: '2', role: 'assistant', text: 'Connect this page to useGenericChat in your Redwood app.' }
      ]}
    />
  );
}
