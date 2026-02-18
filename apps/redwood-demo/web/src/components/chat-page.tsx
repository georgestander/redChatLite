'use client';

import React from 'react';
import './chat-page.css';

type ChatRole = 'user' | 'assistant' | 'system';

type KnownPartType = 'text' | 'file' | 'reasoning' | 'source-url' | 'source-document' | `data-${string}`;

interface TextPart {
  type: 'text';
  text: string;
}

interface FilePart {
  type: 'file';
  mediaType: string;
  filename?: string;
  url: string;
}

interface ReasoningPart {
  type: 'reasoning';
  text: string;
}

interface SourceUrlPart {
  type: 'source-url';
  url: string;
  title?: string;
}

interface SourceDocumentPart {
  type: 'source-document';
  title: string;
  mediaType: string;
  filename?: string;
}

interface DataPart {
  type: `data-${string}`;
  data: unknown;
}

interface GenericPart {
  type: Exclude<string, KnownPartType>;
  [key: string]: any;
}

type ChatPart = TextPart | FilePart | ReasoningPart | SourceUrlPart | SourceDocumentPart | DataPart | GenericPart;

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
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [status, setStatus] = React.useState<ChatStatus>('ready');
  const [error, setError] = React.useState<string | null>(null);

  const composerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const messagesRef = React.useRef<HTMLDivElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (!messagesRef.current) {
      return;
    }

    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, status]);

  React.useEffect(() => {
    composerRef.current?.focus();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextDraft = draft.trim();
    if (!nextDraft && pendingFiles.length === 0) {
      return;
    }

    const parts: ChatPart[] = [];
    if (nextDraft) {
      parts.push({ type: 'text', text: nextDraft });
    }

    if (pendingFiles.length > 0) {
      setUploading(true);
      try {
        const uploads = await Promise.all(pendingFiles.map((file) => uploadAttachment(file)));
        for (const attachment of uploads) {
          parts.push({
            type: 'file',
            mediaType: attachment.mimeType,
            filename: attachment.name,
            url: attachment.url
          });
          parts.push({
            type: 'data-attachment',
            data: { attachmentId: attachment.id }
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
    setPendingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    await streamAssistantReply(userMessage, setMessages, setStatus, setError, abortRef);
  };

  const onPickFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(event.target.files ?? []);
    if (next.length === 0) {
      return;
    }

    setPendingFiles((prev) => [...prev, ...next]);
    event.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
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

    try {
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
          setMessages((prev) => ensureAssistantMessage(prev, id));
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
    } catch (resumeError) {
      setStatus('error');
      setError(resumeError instanceof Error ? resumeError.message : 'Unknown resume error');
    }
  };

  const canStop = status === 'streaming' || status === 'submitted';
  const hasUserMessage = messages.some((message) => message.role === 'user');
  const canSend = !(status === 'streaming' || status === 'submitted' || uploading) && (draft.trim().length > 0 || pendingFiles.length > 0);

  return (
    <section className="rwc-chat-app" aria-label="RedwoodChat app">
      <header className="rwc-chat-header">
        <div className="rwc-chat-brand">
          <span className="rwc-chat-brand-icon" aria-hidden="true">
            ✦
          </span>
          <span>RedwoodChat</span>
        </div>
        <div className={`rwc-chat-status rwc-chat-status-${status}`}>Status: {status}</div>
      </header>

      <main className="rwc-chat-main">
        <div className="rwc-chat-scroll" ref={messagesRef}>
          <div className="rwc-chat-inner" data-testid="chat-message-list">
            {messages.length === 0 ? (
              <article className="rwc-chat-greeting" data-testid="chat-greeting">
                <h1>How can I help today?</h1>
                <p>Ask a question, attach files, or continue an active stream.</p>
              </article>
            ) : null}

            {messages.map((message) => (
              <ChatMessageRow key={message.id} message={message} />
            ))}
          </div>
        </div>
      </main>

      <footer className="rwc-chat-footer">
        <form onSubmit={onSubmit} className="rwc-chat-composer-shell">
          <input
            ref={fileInputRef}
            id="chat-file"
            name="chat-file"
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={onPickFiles}
            className="rwc-hidden-input"
          />

          {pendingFiles.length > 0 ? (
            <div className="rwc-attachment-strip" data-testid="composer-attachments">
              {pendingFiles.map((file, index) => (
                <div key={`${file.name}-${file.lastModified}-${index}`} className="rwc-attachment-chip">
                  <div className="rwc-attachment-name">{file.name}</div>
                  <button
                    className="rwc-chip-remove"
                    type="button"
                    onClick={() => removePendingFile(index)}
                    aria-label={`Remove ${file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <label htmlFor="chat-input" className="rwc-sr-only">
            Message
          </label>
          <textarea
            ref={composerRef}
            id="chat-input"
            name="chat-input"
            value={draft}
            rows={1}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Send a message..."
            className="rwc-chat-input"
          />

          <div className="rwc-chat-toolbar">
            <div className="rwc-chat-toolbar-left">
              <button type="button" className="rwc-btn rwc-btn-ghost" onClick={() => fileInputRef.current?.click()}>
                {uploading ? 'Uploading...' : 'Attach'}
              </button>
              <span className="rwc-chat-hint">Images or PDF</span>
            </div>

            <div className="rwc-chat-toolbar-right">
              <button type="button" className="rwc-btn rwc-btn-ghost" disabled={!hasUserMessage} onClick={() => void resume()}>
                Resume
              </button>
              <button type="button" className="rwc-btn rwc-btn-ghost" disabled={!hasUserMessage} onClick={() => void regenerate()}>
                Regenerate
              </button>
              <button type="button" className="rwc-btn rwc-btn-stop" disabled={!canStop} onClick={stop}>
                Stop
              </button>
              <button
                type="submit"
                className="rwc-btn rwc-btn-primary"
                disabled={!canSend}
              >
                Send
              </button>
            </div>
          </div>

          {error ? (
            <div role="alert" className="rwc-error-banner">
              {error}
            </div>
          ) : null}
        </form>
      </footer>
    </section>
  );
}

function ChatMessageRow(props: { message: ChatMessage }) {
  const { message } = props;

  return (
    <article className={`rwc-message rwc-message-${message.role}`} data-role={message.role}>
      {message.role === 'assistant' ? <div className="rwc-assistant-avatar">✦</div> : null}
      <div className="rwc-message-content">
        {message.parts.map((part, index) => (
          <React.Fragment key={`${message.id}-${index}`}>{renderMessagePart(message.role, part)}</React.Fragment>
        ))}
      </div>
    </article>
  );
}

function renderMessagePart(role: ChatRole, part: ChatPart): React.ReactNode {
  if (part.type === 'text') {
    return <div className={`rwc-message-text ${role === 'user' ? 'rwc-message-text-user' : 'rwc-message-text-assistant'}`}>{part.text}</div>;
  }

  if (part.type === 'file') {
    const isImage = part.mediaType.startsWith('image/');

    return (
      <div className="rwc-part-card rwc-part-file" data-testid="chat-part-file">
        {isImage ? <img src={part.url} alt={part.filename ?? 'attachment'} loading="lazy" className="rwc-file-preview" /> : null}
        <a href={part.url} target="_blank" rel="noreferrer">
          {part.filename ?? part.url}
        </a>
        <div className="rwc-part-meta">{part.mediaType}</div>
      </div>
    );
  }

  if (part.type === 'reasoning') {
    return (
      <details className="rwc-part-card rwc-part-reasoning">
        <summary>Reasoning</summary>
        <pre>{part.text}</pre>
      </details>
    );
  }

  if (part.type === 'source-url') {
    return (
      <div className="rwc-part-card">
        <span className="rwc-part-label">Source</span>
        <a href={part.url} target="_blank" rel="noreferrer">
          {part.title ?? part.url}
        </a>
      </div>
    );
  }

  if (part.type === 'source-document') {
    return (
      <div className="rwc-part-card">
        <span className="rwc-part-label">Source Document</span>
        <div>{part.title}</div>
        <div className="rwc-part-meta">
          {part.mediaType}
          {part.filename ? ` • ${part.filename}` : ''}
        </div>
      </div>
    );
  }

  if (part.type === 'data-attachment') {
    return null;
  }

  if (part.type.startsWith('tool-') || part.type.startsWith('data-') || part.type === 'dynamic-tool') {
    return <pre className="rwc-part-card rwc-part-pre">{JSON.stringify(part, null, 2)}</pre>;
  }

  return <pre className="rwc-part-card rwc-part-pre">{JSON.stringify(part, null, 2)}</pre>;
}

function ensureAssistantMessage(messages: ChatMessage[], id: string): ChatMessage[] {
  if (messages.some((message) => message.id === id)) {
    return messages;
  }

  return [...messages, { id, role: 'assistant', parts: [{ type: 'text', text: '' }] }];
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
        setMessages((prev) => ensureAssistantMessage(prev, id));
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
