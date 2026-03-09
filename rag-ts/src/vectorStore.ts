import { MemoryVectorStore } from "langchain/vectorstores/memory";
import type { Embeddings } from "@langchain/core/embeddings";
import { config } from "./config";

export class VectorStoreService {
  private vectorStore: MemoryVectorStore;

  constructor(embedding: Embeddings) {
    // 使用内存向量存储，避免需要单独的服务器
    this.vectorStore = new MemoryVectorStore(embedding);
  }

  getRetriever() {
    return this.vectorStore.asRetriever({
      k: config.similarityThreshold,
    });
  }

  async addTexts(texts: string[], metadatas: Record<string, any>[]) {
    await this.vectorStore.addDocuments(
      texts.map((text, i) => ({
        pageContent: text,
        metadata: metadatas[i],
      })),
    );
  }

  async similaritySearch(query: string, k?: number) {
    return await this.vectorStore.similaritySearch(query, k);
  }
}
