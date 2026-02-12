import {
  createChatSystem,
  createTelemetryCollector,
  createMockProvider,
  createOpenAIProvider,
  createOpenRouterProvider,
  createRedwoodChatHandlers,
  D1ChatStorageAdapter,
  LocalAttachmentStore,
  R2AttachmentStore,
  type AttachmentStore,
  type ChatProviderAdapter
} from '@redwood-chat/system';

const providerId = process.env.AI_PROVIDER ?? 'mock';

function buildProviderMap(): Record<string, ChatProviderAdapter> {
  const providers: Record<string, ChatProviderAdapter> = {
    mock: createMockProvider(['Hello ', 'from ', 'RedwoodChat'])
  };

  if (process.env.OPENAI_API_KEY) {
    providers.openai = createOpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.openrouter = createOpenRouterProvider({
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'
    });
  }

  return providers;
}

function buildAttachmentStore(): AttachmentStore {
  const localStore = new LocalAttachmentStore('.tmp/attachments');
  const maybeR2 = (globalThis as {
    CHAT_R2_BUCKET?: {
      put: (key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
      delete: (key: string) => Promise<unknown>;
    };
  }).CHAT_R2_BUCKET;

  if (!maybeR2) {
    return localStore;
  }

  return new R2AttachmentStore(maybeR2, {
    fallbackStore: localStore,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    prefix: process.env.R2_PREFIX ?? 'redwood-chat-system'
  });
}

const telemetry = createTelemetryCollector();

const runtime = createChatSystem({
  storage: new D1ChatStorageAdapter(),
  attachments: buildAttachmentStore(),
  providers: buildProviderMap(),
  defaultProviderId: providerId,
  retentionDays: 30,
  emitTelemetry: (event) => {
    telemetry.emit(event);
    if (process.env.CHAT_TELEMETRY_STDOUT === '1') {
      console.info('[redwood-chat.telemetry]', JSON.stringify(event));
    }
  }
});

export const handlers = createRedwoodChatHandlers({ runtime });
export const telemetryEvents = telemetry;
