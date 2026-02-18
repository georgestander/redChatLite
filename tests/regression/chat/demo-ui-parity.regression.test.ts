import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

async function readChatStyles(): Promise<string> {
  const filePath = path.resolve(process.cwd(), 'apps/redwood-demo/web/src/components/chat-page.css');
  return readFile(filePath, 'utf8');
}

describe('demo ui parity regression', () => {
  it('locks core layout and composer selectors used for Vercel-style parity', async () => {
    const styles = await readChatStyles();

    expect(styles).toContain('.rwc-chat-app');
    expect(styles).toContain('.rwc-chat-main');
    expect(styles).toContain('.rwc-chat-footer');
    expect(styles).toContain('.rwc-chat-composer-shell');
    expect(styles).toContain('position: sticky');
  });

  it('locks user bubble and responsive parity tokens', async () => {
    const styles = await readChatStyles();

    expect(styles).toContain('.rwc-message-text-user');
    expect(styles).toContain('background: #006cff');
    expect(styles).toContain('@media (max-width: 768px)');
  });
});
