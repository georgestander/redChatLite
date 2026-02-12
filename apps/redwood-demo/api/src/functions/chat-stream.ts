import { handlers } from '../lib/chat-system.js';

export async function handler(request: Request, params: { id: string }): Promise<Response> {
  return handlers.stream(request, params);
}
