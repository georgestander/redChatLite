export interface OpenAICompatibleConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs?: number;
}
