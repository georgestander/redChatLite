import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const agentsPath = path.join(root, 'AGENTS.md');
const logPath = path.join(root, 'docs', 'log.ndjson');

if (fs.existsSync(agentsPath)) {
  const lines = fs.readFileSync(agentsPath, 'utf8').split(/\r?\n/).length;
  if (lines > 100) {
    console.error(`AGENTS.md must be <= 100 lines, got ${lines}.`);
    process.exit(1);
  }
}

if (fs.existsSync(logPath)) {
  const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/).filter(Boolean);
  for (const [index, line] of lines.entries()) {
    try {
      JSON.parse(line);
    } catch {
      console.error(`Invalid JSON at docs/log.ndjson line ${index + 1}.`);
      process.exit(1);
    }
  }
}

process.exit(0);
