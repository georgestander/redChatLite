export default {
  modules: true,
  compatibilityDate: '2026-02-12',
  d1Databases: {
    CHAT_DB: '.tmp/miniflare/chat-db.sqlite'
  },
  r2Buckets: {
    CHAT_ATTACHMENTS: '.tmp/miniflare/chat-attachments'
  },
  bindings: {
    CHAT_R2_BUCKET: 'CHAT_ATTACHMENTS'
  }
};
