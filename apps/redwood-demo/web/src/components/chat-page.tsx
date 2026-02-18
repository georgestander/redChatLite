'use client';

import React from 'react';
import { useGenericChat } from '@redwood-chat/system/react';
import { DefaultChatShell } from '@redwood-chat/system/ui';

export function ChatPage() {
  const [draft, setDraft] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [files, setFiles] = React.useState<FileList | null>(null);
  const chat = useGenericChat({
    id: 'redwood-demo-chat',
    api: '/api/chat',
    resume: true
  });

  const sendMessage = chat.sendMessage as (message: unknown) => Promise<void>;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next && !files?.length) {
      return;
    }

    const parts: Array<Record<string, unknown>> = [];
    if (next) {
      parts.push({ type: 'text', text: next });
    }

    if (files?.length) {
      setUploading(true);
      try {
        const uploads = await Promise.all(Array.from(files).map((file) => uploadAttachment(file)));
        for (const attachment of uploads) {
          parts.push({
            type: 'file',
            mediaType: attachment.mimeType,
            filename: attachment.name,
            url: attachment.url
          });
        }
      } finally {
        setUploading(false);
      }
    }

    await sendMessage(parts.length === 1 && next ? { text: next } : { parts });
    setDraft('');
    setFiles(null);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <DefaultChatShell title={`RedwoodChat Demo (${chat.status})`} messages={chat.messages} />
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <label htmlFor="chat-input">Message</label>
        <input
          id="chat-input"
          name="chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask something..."
        />
        <label htmlFor="chat-file">Attachments (images or PDF)</label>
        <input
          id="chat-file"
          name="chat-file"
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(event) => setFiles(event.target.files)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="submit" disabled={chat.status === 'streaming' || uploading}>
            {uploading ? 'Uploading...' : 'Send'}
          </button>
          <button
            type="button"
            disabled={chat.status !== 'streaming' && chat.status !== 'submitted'}
            onClick={() => void chat.stop()}
          >
            Stop
          </button>
          <button type="button" onClick={() => void chat.regenerate()}>
            Regenerate
          </button>
          <button type="button" onClick={() => void chat.resumeStream()}>
            Resume
          </button>
        </div>
        {chat.error ? (
          <div role="alert" style={{ color: '#9b1c1c' }}>
            {chat.error.message}
          </div>
        ) : null}
        {files?.length ? (
          <div style={{ fontSize: 13, color: '#444' }}>
            {Array.from(files)
              .map((file) => file.name)
              .join(', ')}
          </div>
        ) : null}
      </form>
    </div>
  );
}

interface UploadedAttachment {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

async function uploadAttachment(file: File): Promise<UploadedAttachment> {
  const formData = new FormData();
  formData.set('threadId', 'redwood-demo-chat');
  formData.set('file', file);

  const response = await fetch('/api/chat/attachments', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Attachment upload failed (${response.status})`);
  }

  const payload = (await response.json()) as { attachment: UploadedAttachment };
  return payload.attachment;
}
