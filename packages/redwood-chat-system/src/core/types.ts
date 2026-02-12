export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessagePart {
  type: 'text' | 'attachment';
  text?: string;
  attachmentId?: string;
  url?: string;
  mimeType?: string;
  name?: string;
  sizeBytes?: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: ChatRole;
  parts: ChatMessagePart[];
  createdAt: string;
  providerId?: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatThread {
  id: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ChatStreamState {
  threadId: string;
  status: 'active' | 'completed' | 'aborted';
  chunks: string[];
  updatedAt: string;
}

export interface ChatAttachment {
  id: string;
  threadId: string;
  messageId?: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  key: string;
  url: string;
  createdAt: string;
}

export interface ChatTelemetryEvent {
  name: string;
  at: string;
  threadId?: string;
  messageId?: string;
  payload?: Record<string, unknown>;
}

export interface ChatProviderStreamRequest {
  threadId: string;
  messages: ChatMessage[];
  model: string;
  metadata?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface ChatProviderStreamEvent {
  type: 'delta' | 'done' | 'error';
  text?: string;
  error?: string;
}

export interface ChatProviderAdapter {
  id: string;
  supportsAttachments: boolean;
  stream(request: ChatProviderStreamRequest): AsyncGenerator<ChatProviderStreamEvent>;
}

export interface ChatStorageAdapter {
  createThread(input: Pick<ChatThread, 'id' | 'sessionId' | 'metadata'>): Promise<ChatThread>;
  getThread(id: string): Promise<ChatThread | null>;
  saveMessage(message: ChatMessage): Promise<void>;
  listMessages(threadId: string): Promise<ChatMessage[]>;
  upsertStreamState(state: ChatStreamState): Promise<void>;
  getStreamState(threadId: string): Promise<ChatStreamState | null>;
  saveAttachment(attachment: ChatAttachment): Promise<void>;
  getAttachment(id: string): Promise<ChatAttachment | null>;
  pruneExpired(cutoffIso: string): Promise<number>;
}

export interface AttachmentUploadInput {
  threadId: string;
  name: string;
  mimeType: string;
  data: Uint8Array;
  messageId?: string;
}

export interface AttachmentStore {
  upload(input: AttachmentUploadInput): Promise<ChatAttachment>;
  get(id: string): Promise<ChatAttachment | null>;
  delete(id: string): Promise<void>;
}

export interface ChatSystemConfig {
  storage: ChatStorageAdapter;
  attachments: AttachmentStore;
  providers: Record<string, ChatProviderAdapter>;
  defaultProviderId: string;
  retentionDays?: number;
  emitTelemetry?: (event: ChatTelemetryEvent) => void | Promise<void>;
  now?: () => Date;
}

export interface SendMessageInput {
  threadId: string;
  sessionId: string;
  messageId: string;
  message: ChatMessage;
  model: string;
  providerId?: string;
}

export interface ChatRuntime {
  sendMessage(input: SendMessageInput): Promise<ReadableStream<Uint8Array>>;
  resumeStream(threadId: string, cursor?: number): Promise<ReadableStream<Uint8Array> | null>;
  uploadAttachment(input: AttachmentUploadInput): Promise<ChatAttachment>;
  runRetention(): Promise<number>;
}
