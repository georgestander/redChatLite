import {
  type AttachmentUploadInput,
  type ChatAttachment,
  type ChatProviderAdapter,
  type ChatRuntime,
  type ChatStorageAdapter,
  type ChatSystemConfig,
  type SendMessageInput
} from './types.js';

const encoder = new TextEncoder();

function sseData(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function getProvider(config: ChatSystemConfig, providerId?: string): ChatProviderAdapter {
  const id = providerId ?? config.defaultProviderId;
  const provider = config.providers[id];
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
}

function nowIso(config: ChatSystemConfig): string {
  return (config.now?.() ?? new Date()).toISOString();
}

export function createChatSystem(config: ChatSystemConfig): ChatRuntime {
  const retentionDays = config.retentionDays ?? 30;

  return {
    async sendMessage(input: SendMessageInput): Promise<ReadableStream<Uint8Array>> {
      await config.storage.createThread({
        id: input.threadId,
        sessionId: input.sessionId,
        metadata: input.message.metadata
      });

      await config.storage.saveMessage(input.message);
      await config.emitTelemetry?.({
        name: 'message.saved',
        at: nowIso(config),
        threadId: input.threadId,
        messageId: input.messageId,
        payload: { role: input.message.role }
      });

      const provider = getProvider(config, input.providerId);
      const stream = provider.stream({
        threadId: input.threadId,
        messages: await config.storage.listMessages(input.threadId),
        model: input.model,
        metadata: input.message.metadata
      });

      return new ReadableStream<Uint8Array>({
        start: async (controller) => {
          const chunks: string[] = [];
          await config.storage.upsertStreamState({
            threadId: input.threadId,
            status: 'active',
            chunks,
            updatedAt: nowIso(config)
          });

          controller.enqueue(sseData({ type: 'start', threadId: input.threadId }));

          try {
            for await (const event of stream) {
              if (event.type === 'delta' && event.text) {
                chunks.push(event.text);
                await config.storage.upsertStreamState({
                  threadId: input.threadId,
                  status: 'active',
                  chunks: [...chunks],
                  updatedAt: nowIso(config)
                });
                controller.enqueue(sseData({ type: 'delta', text: event.text }));
              }
              if (event.type === 'error') {
                controller.enqueue(sseData({ type: 'error', error: event.error ?? 'provider_error' }));
              }
            }

            const assistantId = `${input.threadId}-assistant-${Date.now()}`;
            await config.storage.saveMessage({
              id: assistantId,
              threadId: input.threadId,
              role: 'assistant',
              parts: [{ type: 'text', text: chunks.join('') }],
              createdAt: nowIso(config),
              providerId: provider.id,
              model: input.model
            });

            await config.storage.upsertStreamState({
              threadId: input.threadId,
              status: 'completed',
              chunks: [...chunks],
              updatedAt: nowIso(config)
            });

            await config.emitTelemetry?.({
              name: 'stream.completed',
              at: nowIso(config),
              threadId: input.threadId,
              messageId: assistantId,
              payload: { chunks: chunks.length, providerId: provider.id }
            });

            controller.enqueue(sseData({ type: 'done' }));
          } catch (error) {
            await config.storage.upsertStreamState({
              threadId: input.threadId,
              status: 'aborted',
              chunks,
              updatedAt: nowIso(config)
            });
            controller.enqueue(
              sseData({
                type: 'error',
                error: error instanceof Error ? error.message : 'unknown_error'
              })
            );
          }

          controller.close();
        }
      });
    },

    async resumeStream(threadId: string, cursor = 0): Promise<ReadableStream<Uint8Array> | null> {
      const state = await config.storage.getStreamState(threadId);
      if (!state) {
        return null;
      }

      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(sseData({ type: 'resume', threadId, cursor }));
          for (const chunk of state.chunks.slice(cursor)) {
            controller.enqueue(sseData({ type: 'delta', text: chunk }));
          }
          controller.enqueue(sseData({ type: state.status === 'completed' ? 'done' : 'active' }));
          controller.close();
        }
      });
    },

    async uploadAttachment(input: AttachmentUploadInput): Promise<ChatAttachment> {
      const attachment = await config.attachments.upload(input);
      await config.storage.saveAttachment(attachment);
      await config.emitTelemetry?.({
        name: 'attachment.uploaded',
        at: nowIso(config),
        threadId: input.threadId,
        payload: { attachmentId: attachment.id, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes }
      });
      return attachment;
    },

    async runRetention(): Promise<number> {
      const cutoffDate = new Date((config.now?.() ?? new Date()).getTime() - retentionDays * 24 * 60 * 60 * 1000);
      return config.storage.pruneExpired(cutoffDate.toISOString());
    }
  };
}
