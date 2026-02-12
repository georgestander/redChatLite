import fs from 'node:fs/promises';
import path from 'node:path';
import { type AttachmentStore, type AttachmentUploadInput, type ChatAttachment } from '../core/types.js';
import { validateAttachment } from './validation.js';

export class LocalAttachmentStore implements AttachmentStore {
  private readonly metadata = new Map<string, ChatAttachment>();

  constructor(private readonly rootDir: string) {}

  async upload(input: AttachmentUploadInput): Promise<ChatAttachment> {
    validateAttachment(input.mimeType, input.data.byteLength);

    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const key = `${input.threadId}/${id}/${input.name}`;
    const filePath = path.join(this.rootDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, input.data);

    const attachment = {
      id,
      threadId: input.threadId,
      messageId: input.messageId,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.data.byteLength,
      key,
      url: `/local-attachments/${key}`,
      createdAt: new Date().toISOString()
    };

    this.metadata.set(id, attachment);
    return attachment;
  }

  async get(id: string): Promise<ChatAttachment | null> {
    return this.metadata.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    const attachment = this.metadata.get(id);
    if (!attachment) {
      return;
    }

    this.metadata.delete(id);
    await fs.rm(path.join(this.rootDir, attachment.key), { force: true });
  }
}
