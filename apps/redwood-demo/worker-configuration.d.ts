/* eslint-disable */
declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import('./src/worker');
  }

  interface Env {
    ASSETS: Fetcher;
    CHAT_R2_BUCKET?: {
      put: (key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
      delete: (key: string) => Promise<unknown>;
    };
    AI_PROVIDER?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    OPENROUTER_API_KEY?: string;
    OPENROUTER_MODEL?: string;
    CHAT_TELEMETRY_STDOUT?: string;
    R2_PUBLIC_BASE_URL?: string;
    R2_PREFIX?: string;
  }
}

interface Env extends Cloudflare.Env {}
