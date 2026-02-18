import { render, route } from 'rwsdk/router';
import { defineApp } from 'rwsdk/worker';
import { handlers } from '../api/src/lib/chat-system.js';
import { Document } from './app/document.js';
import { setCommonHeaders } from './app/headers.js';
import { Home } from './app/pages/home.js';

export type AppContext = {};

function syncEnv(input: { env?: Record<string, unknown> }) {
  if (!input.env) {
    return;
  }

  (globalThis as { __REDWOOD_DEMO_ENV?: Record<string, unknown> }).__REDWOOD_DEMO_ENV = input.env;

  const bucket = input.env.CHAT_R2_BUCKET;
  if (bucket) {
    (globalThis as { CHAT_R2_BUCKET?: unknown }).CHAT_R2_BUCKET = bucket;
  }
}

export default defineApp([
  setCommonHeaders(),
  (input) => syncEnv(input as { env?: Record<string, unknown> }),
  render(Document, [
    route('/', Home),
    route('/api/chat', {
      post: ({ request }) => handlers.chat(request)
    }),
    route('/api/chat/:id/stream', {
      get: ({ request, params }) => handlers.stream(request, { id: params.id }),
      post: ({ request, params }) => handlers.stream(request, { id: params.id })
    }),
    route('/api/chat/attachments', {
      post: ({ request }) => handlers.attachments(request)
    })
  ])
]);
