import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

async function readChatPageSource(): Promise<string> {
  const filePath = path.resolve(process.cwd(), 'apps/redwood-demo/web/src/components/chat-page.tsx');
  return readFile(filePath, 'utf8');
}

describe('chat page structure unit', () => {
  it('includes Vercel-style shell sections and control affordances', async () => {
    const source = await readChatPageSource();

    expect(source).toContain("import './chat-page.css';");
    expect(source).toContain('className="rwc-chat-app"');
    expect(source).toContain('className="rwc-chat-main"');
    expect(source).toContain('className="rwc-chat-composer-shell"');
    expect(source).toContain('How can I help today?');
    expect(source).toContain('Attach');
    expect(source).toContain('Resume');
    expect(source).toContain('Regenerate');
    expect(source).toContain('Stop');
    expect(source).toContain('Send');
  });

  it('keeps explicit user bubble styling hook and assistant avatar hook', async () => {
    const source = await readChatPageSource();

    expect(source).toContain('rwc-message-text-user');
    expect(source).toContain('rwc-message-text-assistant');
    expect(source).toContain('className="rwc-assistant-avatar"');
  });
});
