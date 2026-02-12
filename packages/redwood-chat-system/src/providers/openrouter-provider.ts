import { createOpenAIProvider } from './openai-provider.js';

export function createOpenRouterProvider(config: { apiKey: string; model: string; baseUrl?: string }) {
  return {
    ...createOpenAIProvider({
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl ?? 'https://openrouter.ai/api/v1'
    }),
    id: 'openrouter'
  };
}
