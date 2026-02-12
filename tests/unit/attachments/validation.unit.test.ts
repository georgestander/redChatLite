import { describe, expect, it } from 'vitest';
import { MAX_ATTACHMENT_BYTES } from '../../../packages/redwood-chat-system/src/attachments/constants.js';
import { validateAttachment } from '../../../packages/redwood-chat-system/src/attachments/validation.js';

describe('attachment validation', () => {
  it('accepts images and PDFs within limit', () => {
    expect(() => validateAttachment('image/png', 1024)).not.toThrow();
    expect(() => validateAttachment('application/pdf', MAX_ATTACHMENT_BYTES)).not.toThrow();
  });

  it('rejects unsupported mime types and oversize payloads', () => {
    expect(() => validateAttachment('text/plain', 5)).toThrow(/Unsupported/);
    expect(() => validateAttachment('image/jpeg', MAX_ATTACHMENT_BYTES + 1)).toThrow(/exceeds/);
  });
});
