import {
  type ChatAttachment,
  type ChatMessage,
  type ChatStorageAdapter,
  type ChatStreamState,
  type ChatThread
} from '../core/types.js';
import { InMemoryChatStorageAdapter } from './in-memory-storage.js';

interface D1QueryResult<T = unknown> {
  results?: T[];
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run<T = unknown>(): Promise<T>;
  all<T = unknown>(): Promise<D1QueryResult<T>>;
  first<T = unknown>(): Promise<T | null>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<unknown>;
}

interface ChatMessageRow {
  id: string;
  thread_id: string;
  role: string;
  parts_json: string;
  created_at: string;
  provider_id: string | null;
  model: string | null;
  metadata_json: string | null;
}

interface ChatThreadRow {
  id: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  metadata_json: string | null;
}

interface ChatAttachmentRow {
  id: string;
  thread_id: string;
  message_id: string | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  url: string;
  created_at: string;
}

interface ChatStreamStateRow {
  thread_id: string;
  status: string;
  chunks_json: string;
  updated_at: string;
}

const D1_SCHEMA = `
CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL,
  parts_json TEXT NOT NULL,
  provider_id TEXT,
  model TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
);

CREATE TABLE IF NOT EXISTS chat_attachments (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  message_id TEXT,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
);

CREATE TABLE IF NOT EXISTS chat_stream_state (
  thread_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  chunks_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
);
`;

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class D1ChatStorageAdapter implements ChatStorageAdapter {
  readonly kind = 'd1';

  private readonly memoryFallback: InMemoryChatStorageAdapter;
  private initialized = false;

  constructor(private readonly db?: D1DatabaseLike) {
    this.memoryFallback = new InMemoryChatStorageAdapter();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db || this.initialized) {
      return;
    }

    await this.db.exec(D1_SCHEMA);
    this.initialized = true;
  }

  private shouldFallback(): boolean {
    return !this.db;
  }

  async createThread(input: Pick<ChatThread, 'id' | 'sessionId' | 'metadata'>): Promise<ChatThread> {
    if (this.shouldFallback()) {
      return this.memoryFallback.createThread(input);
    }

    await this.ensureInitialized();

    const existing = await this.getThread(input.id);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    await this.db!
      .prepare(
        `INSERT INTO chat_threads (id, session_id, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(input.id, input.sessionId, JSON.stringify(input.metadata ?? {}), now, now)
      .run();

    return {
      id: input.id,
      sessionId: input.sessionId,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now
    };
  }

  async getThread(id: string): Promise<ChatThread | null> {
    if (this.shouldFallback()) {
      return this.memoryFallback.getThread(id);
    }

    await this.ensureInitialized();

    const row = await this.db!
      .prepare(`SELECT id, session_id, metadata_json, created_at, updated_at FROM chat_threads WHERE id = ?`)
      .bind(id)
      .first<ChatThreadRow>();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      sessionId: row.session_id,
      metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    if (this.shouldFallback()) {
      await this.memoryFallback.saveMessage(message);
      return;
    }

    await this.ensureInitialized();

    await this.db!
      .prepare(
        `INSERT OR REPLACE INTO chat_messages
         (id, thread_id, role, parts_json, provider_id, model, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        message.id,
        message.threadId,
        message.role,
        JSON.stringify(message.parts),
        message.providerId ?? null,
        message.model ?? null,
        JSON.stringify(message.metadata ?? {}),
        message.createdAt
      )
      .run();

    await this.db!
      .prepare(`UPDATE chat_threads SET updated_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), message.threadId)
      .run();
  }

  async listMessages(threadId: string): Promise<ChatMessage[]> {
    if (this.shouldFallback()) {
      return this.memoryFallback.listMessages(threadId);
    }

    await this.ensureInitialized();

    const result = await this.db!
      .prepare(
        `SELECT id, thread_id, role, parts_json, provider_id, model, metadata_json, created_at
         FROM chat_messages
         WHERE thread_id = ?
         ORDER BY created_at ASC`
      )
      .bind(threadId)
      .all<ChatMessageRow>();

    return (result.results ?? []).map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      role: row.role as ChatMessage['role'],
      parts: parseJson<ChatMessage['parts']>(row.parts_json, []),
      providerId: row.provider_id ?? undefined,
      model: row.model ?? undefined,
      metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
      createdAt: row.created_at
    }));
  }

  async upsertStreamState(state: ChatStreamState): Promise<void> {
    if (this.shouldFallback()) {
      await this.memoryFallback.upsertStreamState(state);
      return;
    }

    await this.ensureInitialized();

    await this.db!
      .prepare(
        `INSERT OR REPLACE INTO chat_stream_state (thread_id, status, chunks_json, updated_at)
         VALUES (?, ?, ?, ?)`
      )
      .bind(state.threadId, state.status, JSON.stringify(state.chunks), state.updatedAt)
      .run();
  }

  async getStreamState(threadId: string): Promise<ChatStreamState | null> {
    if (this.shouldFallback()) {
      return this.memoryFallback.getStreamState(threadId);
    }

    await this.ensureInitialized();

    const row = await this.db!
      .prepare(`SELECT thread_id, status, chunks_json, updated_at FROM chat_stream_state WHERE thread_id = ?`)
      .bind(threadId)
      .first<ChatStreamStateRow>();

    if (!row) {
      return null;
    }

    return {
      threadId: row.thread_id,
      status: row.status as ChatStreamState['status'],
      chunks: parseJson<string[]>(row.chunks_json, []),
      updatedAt: row.updated_at
    };
  }

  async saveAttachment(attachment: ChatAttachment): Promise<void> {
    if (this.shouldFallback()) {
      await this.memoryFallback.saveAttachment(attachment);
      return;
    }

    await this.ensureInitialized();

    await this.db!
      .prepare(
        `INSERT OR REPLACE INTO chat_attachments
         (id, thread_id, message_id, name, mime_type, size_bytes, storage_key, url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        attachment.id,
        attachment.threadId,
        attachment.messageId ?? null,
        attachment.name,
        attachment.mimeType,
        attachment.sizeBytes,
        attachment.key,
        attachment.url,
        attachment.createdAt
      )
      .run();
  }

  async getAttachment(id: string): Promise<ChatAttachment | null> {
    if (this.shouldFallback()) {
      return this.memoryFallback.getAttachment(id);
    }

    await this.ensureInitialized();

    const row = await this.db!
      .prepare(
        `SELECT id, thread_id, message_id, name, mime_type, size_bytes, storage_key, url, created_at
         FROM chat_attachments
         WHERE id = ?`
      )
      .bind(id)
      .first<ChatAttachmentRow>();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      threadId: row.thread_id,
      messageId: row.message_id ?? undefined,
      name: row.name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      key: row.storage_key,
      url: row.url,
      createdAt: row.created_at
    };
  }

  async pruneExpired(cutoffIso: string): Promise<number> {
    if (this.shouldFallback()) {
      return this.memoryFallback.pruneExpired(cutoffIso);
    }

    await this.ensureInitialized();

    const stale = await this.db!
      .prepare(`SELECT id FROM chat_threads WHERE updated_at < ?`)
      .bind(cutoffIso)
      .all<{ id: string }>();

    const ids = (stale.results ?? []).map((row) => row.id);
    for (const id of ids) {
      await this.db!.prepare(`DELETE FROM chat_messages WHERE thread_id = ?`).bind(id).run();
      await this.db!.prepare(`DELETE FROM chat_attachments WHERE thread_id = ?`).bind(id).run();
      await this.db!.prepare(`DELETE FROM chat_stream_state WHERE thread_id = ?`).bind(id).run();
      await this.db!.prepare(`DELETE FROM chat_threads WHERE id = ?`).bind(id).run();
    }

    return ids.length;
  }
}
