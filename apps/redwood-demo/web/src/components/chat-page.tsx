'use client';

import React from 'react';
import { DefaultChatShell } from '@redwood-chat/system/ui';

type ChatRole = 'user' | 'assistant' | 'system';

type ChatPart =
  | { type: 'text'; text: string }
  | { type: 'file'; mediaType: string; filename?: string; url: string }
  | { type: `data-${string}`; data: unknown }
  | { type: string; [key: string]: unknown };

interface ChatMessage {
  id: string;
  role: ChatRole;
  parts: ChatPart[];
}

interface UploadedAttachment {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

const THREAD_ID = 'redwood-demo-chat';

export function ChatPage() {
  const [draft, setDraft] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [status, setStatus] = React.useState<ChatStatus>('ready');
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next && !files?.length) {
      return;
    }

    const parts: ChatPart[] = [];
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
          parts.push({
            type: 'data-attachment',
            data: {
              attachmentId: attachment.id
            }
          });
        }
      } finally {
        setUploading(false);
      }
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setFiles(null);
    await streamAssistantReply(userMessage, setMessages, setStatus, setError, abortRef);
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('ready');
  };

  const regenerate = async () => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    if (!lastUser) {
      return;
    }

    await streamAssistantReply(lastUser, setMessages, setStatus, setError, abortRef);
  };

  const resume = async () => {
    setStatus('streaming');
    setError(null);

    const response = await fetch(`/api/chat/${THREAD_ID}/stream`, {
      method: 'GET'
    });

    if (!response.ok || !response.body) {
      setStatus('error');
      setError(`Resume failed (${response.status})`);
      return;
    }

    await consumeUiEventStream(response.body, {
      onTextStart: (id) => {
        setMessages((prev) => [...prev, { id, role: 'assistant', parts: [{ type: 'text', text: '' }] }]);
      },
      onTextDelta: (id, delta) => {
        setMessages((prev) => appendAssistantDelta(prev, id, delta));
      },
      onError: (message) => {
        setStatus('error');
        setError(message);
      }
    });

    setStatus('ready');
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <DefaultChatShell title={`RedwoodChat Demo (${status})`} messages={messages as never} />
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
          <button type="submit" disabled={status === 'streaming' || uploading}>
            {uploading ? 'Uploading...' : 'Send'}
          </button>
          <button type="button" disabled={status !== 'streaming' && status !== 'submitted'} onClick={stop}>
            Stop
          </button>
          <button type="button" onClick={() => void regenerate()}>
            Regenerate
          </button>
          <button type="button" onClick={() => void resume()}>
            Resume
          </button>
        </div>
        {error ? (
          <div role="alert" style={{ color: '#9b1c1c' }}>
            {error}
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

async function streamAssistantReply(
  userMessage: ChatMessage,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setStatus: React.Dispatch<React.SetStateAction<ChatStatus>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  abortRef: React.MutableRefObject<AbortController | null>
): Promise<void> {
  setStatus('submitted');
  setError(null);

  const abortController = new AbortController();
  abortRef.current = abortController;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: THREAD_ID,
      sessionId: 'local-demo',
      message: {
        ...userMessage,
        threadId: THREAD_ID,
        createdAt: new Date().toISOString()
      }
    }),
    signal: abortController.signal
  });

  if (!response.ok || !response.body) {
    setStatus('error');
    setError(`Request failed (${response.status})`);
    return;
  }

  setStatus('streaming');

  try {
    await consumeUiEventStream(response.body, {
      onTextStart: (id) => {
        setMessages((prev) => [...prev, { id, role: 'assistant', parts: [{ type: 'text', text: '' }] }]);
      },
      onTextDelta: (id, delta) => {
        setMessages((prev) => appendAssistantDelta(prev, id, delta));
      },
      onError: (message) => {
        setStatus('error');
        setError(message);
      }
    });
    setStatus('ready');
  } catch (streamError) {
    if (abortController.signal.aborted) {
      setStatus('ready');
      return;
    }

    setStatus('error');
    setError(streamError instanceof Error ? streamError.message : 'Unknown stream error');
  } finally {
    abortRef.current = null;
  }
}

function appendAssistantDelta(messages: ChatMessage[], id: string, delta: string): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== id) {
      return message;
    }

    const firstPart = message.parts[0];
    if (!firstPart || firstPart.type !== 'text') {
      return {
        ...message,
        parts: [{ type: 'text', text: delta }, ...message.parts]
      };
    }

    return {
      ...message,
      parts: [{ ...firstPart, text: `${firstPart.text}${delta}` }, ...message.parts.slice(1)]
    };
  });
}

async function consumeUiEventStream(
  stream: ReadableStream<Uint8Array>,
  handlers: {
    onTextStart: (id: string) => void;
    onTextDelta: (id: string, delta: string) => void;
    onError: (message: string) => void;
  }
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }

    buffer += decoder.decode(chunk.value, { stream: true });
    const packets = buffer.split('\n\n');
    buffer = packets.pop() ?? '';

    for (const packet of packets) {
      const dataLine = packet
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('data:'));

      if (!dataLine) {
        continue;
      }

      const payloadText = dataLine.slice('data:'.length).trim();
      if (!payloadText || payloadText === '[DONE]') {
        continue;
      }

      try {
        const event = JSON.parse(payloadText) as {
          type?: string;
          id?: string;
          delta?: string;
          data?: { message?: string };
        };

        if (event.type === 'text-start' && event.id) {
          handlers.onTextStart(event.id);
        }

        if (event.type === 'text-delta' && event.id && typeof event.delta === 'string') {
          handlers.onTextDelta(event.id, event.delta);
        }

        if (event.type === 'data-error') {
          handlers.onError(event.data?.message ?? 'stream_error');
        }
      } catch {
        continue;
      }
    }
  }
}

async function uploadAttachment(file: File): Promise<UploadedAttachment> {
  const formData = new FormData();
  formData.set('threadId', THREAD_ID);
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
