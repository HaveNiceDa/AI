import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { Document } from "@langchain/core/documents";
import dotenv from "dotenv";

dotenv.config();

// 创建 CSVLoader 实例
const loader = new CSVLoader("./data/info.csv");

// 简单的内存向量存储类
class SimpleVectorStore {
  private documents: Map<string, { doc: Document; embedding: number[] }> = new Map();
  private embeddings: any;

  constructor(embeddings: any) {
    this.embeddings = embeddings;
  }

  async addDocuments(docs: Document[], ids?: string[]): Promise<void> {
    const documentIds = ids || docs.map((_, i) => `id${i + 1}`);
    
    for (let i = 0; i < docs.length; i++) {
      const embedding = await this.embeddings.embedQuery(docs[i].pageContent);
      this.documents.set(documentIds[i], { doc: docs[i], embedding });
    }
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.documents.delete(id);
    }
  }

  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    const results = Array.from(this.documents.entries()).map(([id, { doc, embedding }]) => {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      return { doc, similarity };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, k).map(r => r.doc);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// 加载文档
async function main() {
  try {
    // 创建嵌入模型实例，使用阿里通义千问嵌入模型
    const embeddings = new AlibabaTongyiEmbeddings({
      modelName: "text-embedding-v1",
      apiKey: process.env.API_KEY,
    });

    // 加载文档
    const documents = await loader.load();
    console.log(`加载了 ${documents.length} 个文档`);

    // 创建向量存储实例
    const vectorStore = new SimpleVectorStore(embeddings);

    // 生成 ID 列表: id1, id2, id3, id4, ...
    const ids = documents.map((_, i) => `id${i + 1}`);

    // 向量存储的新增
    await vectorStore.addDocuments(documents, ids);
    console.log(`✓ 已添加 ${documents.length} 个文档到向量存储`);

    // 删除
    await vectorStore.delete(["id1", "id2"]);
    console.log("✓ 已删除 id1 和 id2");

    // 检索 - 相似度搜索
    const results = await vectorStore.similaritySearch("Python是不是简单易学呀");
    console.log("\n相似度搜索结果:");
    for (const result of results) {
      console.log(`- ${result.pageContent}`);
    }
  } catch (error) {
    console.error("错误:", error);
  }
}

main();