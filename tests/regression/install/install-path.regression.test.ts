import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('install path regression', () => {
  it('keeps required scripts and docs paths intact', () => {
    const root = process.cwd();
    const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(rootPackage.scripts.lint).toContain('pnpm');
    expect(rootPackage.scripts.typecheck).toContain('pnpm');
    expect(rootPackage.scripts['test:unit']).toContain('vitest');
    expect(rootPackage.scripts['test:regression']).toContain('vitest');

    expect(fs.existsSync(path.join(root, 'docs/plan.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'docs/roadmap.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'docs/log.ndjson'))).toBe(true);
  });
});
