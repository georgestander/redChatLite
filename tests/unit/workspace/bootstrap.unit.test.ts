import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(process.cwd());

describe('workspace bootstrap', () => {
  it('has the expected pnpm workspace layout and package exports', () => {
    const workspace = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
    expect(workspace).toContain('apps/*');
    expect(workspace).toContain('packages/*');

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, 'packages/redwood-chat-system/package.json'), 'utf8')
    ) as { exports: Record<string, string> };

    expect(packageJson.exports['./core']).toBe('./src/core/index.ts');
    expect(packageJson.exports['./react']).toBe('./src/react/index.ts');
    expect(packageJson.exports['./redwood']).toBe('./src/redwood/index.ts');
    expect(packageJson.exports['./providers']).toBe('./src/providers/index.ts');
    expect(packageJson.exports['./ui']).toBe('./src/ui/index.ts');
  });
});
