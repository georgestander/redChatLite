import { handlers } from '../lib/chat-system.js';

export async function handler(request: Request): Promise<Response> {
  return handlers.attachments(request);
}
