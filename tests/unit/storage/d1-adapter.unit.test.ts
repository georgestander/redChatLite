import { describe, expect, it } from 'vitest';
import {
  D1ChatStorageAdapter,
  type D1DatabaseLike
} from '../../../packages/redwood-chat-system/src/storage/d1-storage.js';

class FakeD1 implements D1DatabaseLike {
  readonly execCalls: string[] = [];
  readonly threads = new Map<string, Record<string, unknown>>();
  readonly messages = new Map<string, Array<Record<string, unknown>>>();

  prepare(query: string) {
    const state = { query, params: [] as unknown[] };

    return {
      bind: (...values: unknown[]) => {
        state.params = values;
        return this.prepareStatement(state);
      },
      run: async () => ({}),
      all: async () => ({ results: [] as unknown[] }),
      first: async () => null
    };
  }

  exec(query: string): Promise<unknown> {
    this.execCalls.push(query);
    return Promise.resolve({});
  }

  private prepareStatement(state: { query: string; params: unknown[] }) {
    return {
      bind: (...values: unknown[]) => {
        state.params = values;
        return this.prepareStatement(state);
      },
      run: async () => {
        if (state.query.includes('INSERT INTO chat_threads')) {
          const [id, sessionId, metadataJson, createdAt, updatedAt] = state.params;
          this.threads.set(String(id), {
            id,
            session_id: sessionId,
            metadata_json: metadataJson,
            created_at: createdAt,
            updated_at: updatedAt
          });
        }

        if (state.query.includes('INSERT OR REPLACE INTO chat_messages')) {
          const [id, threadId, role, partsJson, providerId, model, metadataJson, createdAt] = state.params;
          const list = this.messages.get(String(threadId)) ?? [];
          list.push({
            id,
            thread_id: threadId,
            role,
            parts_json: partsJson,
            provider_id: providerId,
            model,
            metadata_json: metadataJson,
            created_at: createdAt
          });
          this.messages.set(String(threadId), list);
        }

        if (state.query.includes('UPDATE chat_threads SET updated_at')) {
          const [updatedAt, id] = state.params;
          const row = this.threads.get(String(id));
          if (row) {
            row.updated_at = updatedAt;
          }
        }

        return {};
      },
      all: async () => {
        if (state.query.includes('FROM chat_messages')) {
          const [threadId] = state.params;
          return { results: this.messages.get(String(threadId)) ?? [] };
        }

        return { results: [] as unknown[] };
      },
      first: async () => {
        if (state.query.includes('FROM chat_threads')) {
          const [id] = state.params;
          return this.threads.get(String(id)) ?? null;
        }

        return null;
      }
    };
  }
}

describe('d1 storage adapter', () => {
  it('persists threads, messages, stream state, and attachments', async () => {
    const storage = new D1ChatStorageAdapter();
    const thread = await storage.createThread({ id: 't1', sessionId: 'anon', metadata: { env: 'test' } });
    expect(thread.id).toBe('t1');

    await storage.saveMessage({
      id: 'm1',
      threadId: 't1',
      role: 'user',
      parts: [{ type: 'text', text: 'hello' }],
      createdAt: new Date().toISOString()
    });

    const messages = await storage.listMessages('t1');
    expect(messages).toHaveLength(1);

    await storage.upsertStreamState({
      threadId: 't1',
      status: 'active',
      chunks: ['hello'],
      updatedAt: new Date().toISOString()
    });

    const state = await storage.getStreamState('t1');
    expect(state?.status).toBe('active');

    await storage.saveAttachment({
      id: 'a1',
      threadId: 't1',
      name: 'x.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
      key: 'k',
      url: 'u',
      createdAt: new Date().toISOString()
    });

    const attachment = await storage.getAttachment('a1');
    expect(attachment?.id).toBe('a1');
  });

  it('uses D1 query path when a D1 binding is provided', async () => {
    const fakeDb = new FakeD1();
    const storage = new D1ChatStorageAdapter(fakeDb);

    await storage.createThread({ id: 'thread-d1', sessionId: 'anon', metadata: { d1: true } });
    await storage.saveMessage({
      id: 'msg-d1',
      threadId: 'thread-d1',
      role: 'user',
      parts: [{ type: 'text', text: 'd1 path' }],
      createdAt: new Date().toISOString()
    });

    const messages = await storage.listMessages('thread-d1');
    expect(fakeDb.execCalls.length).toBe(1);
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe('msg-d1');
  });
});
