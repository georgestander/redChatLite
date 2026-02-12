import { describe, expect, it } from 'vitest';
import { createMockProvider, createOpenRouterProvider } from '../../../packages/redwood-chat-system/src/providers/index.js';

describe('provider registry', () => {
  it('exposes distinct provider ids for config-driven swaps', () => {
    const providers = {
      mock: createMockProvider(),
      openrouter: createOpenRouterProvider({ apiKey: 'or-key', model: 'openai/gpt-4o-mini' })
    };

    expect(providers.mock.id).toBe('mock');
    expect(providers.openrouter.id).toBe('openrouter');
    expect(Object.keys(providers)).toEqual(['mock', 'openrouter']);
  });
});
