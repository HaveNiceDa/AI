export const config = {
  md5Path: './md5.text',

  chroma: {
    collectionName: 'rag',
    persistDirectory: './chroma_db'
  },

  splitter: {
    chunkSize: 1000,
    chunkOverlap: 100,
    separators: ['\n\n', '\n', '.', '!', '?', '。', '！', '？', ' ', ''],
    maxSplitCharNumber: 1000
  },

  similarityThreshold: 1,

  embeddingModelName: 'text-embedding-v4',
  chatModelName: 'qwen3-max',

  sessionConfig: {
    configurable: {
      sessionId: 'user_001'
    }
  }
};
