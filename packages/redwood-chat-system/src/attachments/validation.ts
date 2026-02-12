import { ALLOWED_MIME_TYPES, MAX_ATTACHMENT_BYTES } from './constants.js';

export function isAllowedMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/') || ALLOWED_MIME_TYPES.includes(mimeType);
}

export function validateAttachment(mimeType: string, sizeBytes: number): void {
  if (!isAllowedMimeType(mimeType)) {
    throw new Error(`Unsupported attachment mime type: ${mimeType}`);
  }

  if (sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new Error(`Attachment exceeds max size of ${MAX_ATTACHMENT_BYTES} bytes`);
  }
}
