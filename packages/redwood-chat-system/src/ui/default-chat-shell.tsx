import React from 'react';
import { type UIMessage } from 'ai';

export interface DefaultChatShellProps {
  title?: string;
  messages: UIMessage[];
}

export function DefaultChatShell(props: DefaultChatShellProps) {
  return (
    <section aria-label="chat-shell" style={{ border: '1px solid #d0d0d0', borderRadius: 8, padding: 16, display: 'grid', gap: 12 }}>
      <h2 style={{ marginTop: 0 }}>{props.title ?? 'Redwood Chat'}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {props.messages.map((message) => (
          <li key={message.id} style={{ marginBottom: 12, borderTop: '1px solid #ececec', paddingTop: 10 }}>
            <div style={{ marginBottom: 6 }}>
              <strong>{message.role}</strong>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {(message.parts ?? []).map((part, index) => (
                <React.Fragment key={`${message.id}-${index}`}>{renderMessagePart(part)}</React.Fragment>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function renderMessagePart(part: UIMessage['parts'][number]) {
  if (part.type === 'text') {
    return <div>{part.text}</div>;
  }

  if (part.type === 'reasoning') {
    return <pre style={partBlockStyle('Reasoning')}>{part.text}</pre>;
  }

  if (part.type === 'file') {
    return (
      <div style={partBlockStyle('File')}>
        <a href={part.url} target="_blank" rel="noreferrer">
          {part.filename ?? part.url}
        </a>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{part.mediaType}</div>
      </div>
    );
  }

  if (part.type === 'source-url') {
    return (
      <div style={partBlockStyle('Source URL')}>
        <a href={part.url} target="_blank" rel="noreferrer">
          {part.title ?? part.url}
        </a>
      </div>
    );
  }

  if (part.type === 'source-document') {
    return (
      <div style={partBlockStyle('Source Document')}>
        <div>{part.title}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {part.mediaType}
          {part.filename ? ` • ${part.filename}` : ''}
        </div>
      </div>
    );
  }

  if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
    return <pre style={partBlockStyle('Tool')}>{JSON.stringify(part, null, 2)}</pre>;
  }

  if (part.type.startsWith('data-')) {
    return <pre style={partBlockStyle('Data')}>{JSON.stringify(part, null, 2)}</pre>;
  }

  return <pre style={partBlockStyle('Part')}>{JSON.stringify(part, null, 2)}</pre>;
}

function partBlockStyle(label: string): React.CSSProperties {
  return {
    margin: 0,
    padding: 8,
    borderRadius: 6,
    border: '1px solid #e5e5e5',
    background: '#fafafa',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 13
  };
}
