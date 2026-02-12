import {
  createChatSystem,
  createMockProvider,
  createOpenAIProvider,
  createOpenRouterProvider,
  createRedwoodChatHandlers,
  D1ChatStorageAdapter,
  LocalAttachmentStore,
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

const runtime = createChatSystem({
  storage: new D1ChatStorageAdapter(),
  attachments: new LocalAttachmentStore('.tmp/attachments'),
  providers: buildProviderMap(),
  defaultProviderId: providerId,
  retentionDays: 30
});

export const handlers = createRedwoodChatHandlers({ runtime });
