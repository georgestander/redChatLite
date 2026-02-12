import { InMemoryChatStorageAdapter } from './in-memory-storage.js';

export class D1ChatStorageAdapter extends InMemoryChatStorageAdapter {
  readonly kind = 'd1';
}
