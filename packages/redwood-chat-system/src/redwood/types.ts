import { type ChatRuntime, type ChatSystemConfig } from '../core/types.js';

export interface RedwoodChatHandlers {
  chat: (request: Request) => Promise<Response>;
  stream: (request: Request, params: { id: string }) => Promise<Response>;
  attachments: (request: Request) => Promise<Response>;
}

export interface RedwoodChatHandlerConfig {
  runtime: ChatRuntime;
}

export interface RedwoodChatRuntimeFactory {
  (config: ChatSystemConfig): ChatRuntime;
}
