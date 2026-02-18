import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('install path regression', () => {
  it('keeps required scripts and repo policy intact', () => {
    const root = process.cwd();
    const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');

    expect(rootPackage.scripts.lint).toContain('pnpm');
    expect(rootPackage.scripts.typecheck).toContain('pnpm');
    expect(rootPackage.scripts['test:unit']).toContain('vitest');
    expect(rootPackage.scripts['test:regression']).toContain('vitest');

    // Docs are intentionally ignored/untracked for this repo; CI clones may not contain docs/*.
    expect(gitignore).toContain('/docs');
  });
});
