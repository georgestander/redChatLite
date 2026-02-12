import { type AttachmentStore, type AttachmentUploadInput, type ChatAttachment } from '../core/types.js';
import { validateAttachment } from './validation.js';

export interface R2BucketLike {
  put(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  delete(key: string): Promise<unknown>;
}

export interface R2AttachmentStoreOptions {
  prefix?: string;
  publicBaseUrl?: string;
  fallbackStore?: AttachmentStore;
}

function createAttachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class R2AttachmentStore implements AttachmentStore {
  private readonly metadata = new Map<string, ChatAttachment>();
  private readonly prefix: string;

  constructor(
    private readonly bucket: R2BucketLike,
    private readonly options: R2AttachmentStoreOptions = {}
  ) {
    this.prefix = options.prefix ?? 'chat-attachments';
  }

  async upload(input: AttachmentUploadInput): Promise<ChatAttachment> {
    validateAttachment(input.mimeType, input.data.byteLength);

    const id = createAttachmentId();
    const key = `${this.prefix}/${input.threadId}/${id}/${input.name}`;

    try {
      await this.bucket.put(key, input.data, {
        httpMetadata: {
          contentType: input.mimeType
        }
      });

      const attachment: ChatAttachment = {
        id,
        threadId: input.threadId,
        messageId: input.messageId,
        name: input.name,
        mimeType: input.mimeType,
        sizeBytes: input.data.byteLength,
        key,
        url: this.options.publicBaseUrl ? `${this.options.publicBaseUrl}/${key}` : `r2://${key}`,
        createdAt: new Date().toISOString()
      };

      this.metadata.set(id, attachment);
      return attachment;
    } catch (error) {
      if (this.options.fallbackStore) {
        return this.options.fallbackStore.upload(input);
      }

      throw new Error(
        `R2 upload failed${error instanceof Error ? `: ${error.message}` : ''}`
      );
    }
  }

  async get(id: string): Promise<ChatAttachment | null> {
    const stored = this.metadata.get(id);
    if (stored) {
      return stored;
    }

    if (this.options.fallbackStore) {
      return this.options.fallbackStore.get(id);
    }

    return null;
  }

  async delete(id: string): Promise<void> {
    const stored = this.metadata.get(id);
    if (stored) {
      await this.bucket.delete(stored.key);
      this.metadata.delete(id);
    }

    if (this.options.fallbackStore) {
      await this.options.fallbackStore.delete(id);
    }
  }
}
