import {
  createChatSystem,
  type AttachmentStore,
  type ChatProviderAdapter
} from '@redwood-chat/system/core';
import { createTelemetryCollector } from '@redwood-chat/system/telemetry';
import { createMockProvider, createOpenAIProvider, createOpenRouterProvider } from '@redwood-chat/system/providers';
import { createRedwoodChatHandlers } from '@redwood-chat/system/redwood';
import { D1ChatStorageAdapter } from '@redwood-chat/system/storage';
import { LocalAttachmentStore, R2AttachmentStore } from '@redwood-chat/system/attachments';

function readEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name];
  }

  const runtimeEnv = (globalThis as { __REDWOOD_DEMO_ENV?: Record<string, unknown> }).__REDWOOD_DEMO_ENV;
  const value = runtimeEnv?.[name];
  return typeof value === 'string' ? value : undefined;
}

const providerId = readEnv('AI_PROVIDER') ?? 'mock';

function buildProviderMap(): Record<string, ChatProviderAdapter> {
  const providers: Record<string, ChatProviderAdapter> = {
    mock: createMockProvider(['Hello ', 'from ', 'RedwoodChat'])
  };

  const openAiApiKey = readEnv('OPENAI_API_KEY');
  if (openAiApiKey) {
    providers.openai = createOpenAIProvider({
      apiKey: openAiApiKey,
      model: readEnv('OPENAI_MODEL') ?? 'gpt-4o-mini'
    });
  }

  const openRouterApiKey = readEnv('OPENROUTER_API_KEY');
  if (openRouterApiKey) {
    providers.openrouter = createOpenRouterProvider({
      apiKey: openRouterApiKey,
      model: readEnv('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini'
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
    publicBaseUrl: readEnv('R2_PUBLIC_BASE_URL'),
    prefix: readEnv('R2_PREFIX') ?? 'redwood-chat-system'
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
    if (readEnv('CHAT_TELEMETRY_STDOUT') === '1') {
      console.info('[redwood-chat.telemetry]', JSON.stringify(event));
    }
  }
});

export const handlers = createRedwoodChatHandlers({ runtime });
export const telemetryEvents = telemetry;
