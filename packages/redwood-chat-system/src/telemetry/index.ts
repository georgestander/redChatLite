import { type ChatTelemetryEvent } from '../core/types.js';

export const CHAT_TELEMETRY_EVENT_NAMES = {
  messageSaved: 'message.saved',
  streamCompleted: 'stream.completed',
  attachmentUploaded: 'attachment.uploaded'
} as const;

export function createTelemetryCollector() {
  const events: ChatTelemetryEvent[] = [];
  return {
    emit(event: ChatTelemetryEvent) {
      events.push(event);
    },
    all() {
      return [...events];
    }
  };
}
