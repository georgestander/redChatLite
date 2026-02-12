import { type ChatAttachment, type ChatMessage, type ChatStorageAdapter, type ChatStreamState, type ChatThread } from '../core/types.js';

export class InMemoryChatStorageAdapter implements ChatStorageAdapter {
  private readonly threads = new Map<string, ChatThread>();
  private readonly messages = new Map<string, ChatMessage[]>();
  private readonly attachments = new Map<string, ChatAttachment>();
  private readonly streamStates = new Map<string, ChatStreamState>();

  async createThread(input: Pick<ChatThread, 'id' | 'sessionId' | 'metadata'>): Promise<ChatThread> {
    const existing = this.threads.get(input.id);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const thread: ChatThread = {
      id: input.id,
      sessionId: input.sessionId,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata
    };

    this.threads.set(thread.id, thread);
    return thread;
  }

  async getThread(id: string): Promise<ChatThread | null> {
    return this.threads.get(id) ?? null;
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    const list = this.messages.get(message.threadId) ?? [];
    list.push(message);
    this.messages.set(message.threadId, list);
  }

  async listMessages(threadId: string): Promise<ChatMessage[]> {
    return [...(this.messages.get(threadId) ?? [])];
  }

  async upsertStreamState(state: ChatStreamState): Promise<void> {
    this.streamStates.set(state.threadId, state);
  }

  async getStreamState(threadId: string): Promise<ChatStreamState | null> {
    return this.streamStates.get(threadId) ?? null;
  }

  async saveAttachment(attachment: ChatAttachment): Promise<void> {
    this.attachments.set(attachment.id, attachment);
  }

  async getAttachment(id: string): Promise<ChatAttachment | null> {
    return this.attachments.get(id) ?? null;
  }

  async pruneExpired(cutoffIso: string): Promise<number> {
    let deleted = 0;
    for (const [threadId, thread] of this.threads) {
      if (thread.updatedAt < cutoffIso) {
        this.threads.delete(threadId);
        this.messages.delete(threadId);
        this.streamStates.delete(threadId);
        deleted += 1;
      }
    }
    return deleted;
  }
}
