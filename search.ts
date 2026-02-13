/**
 * 提示词: 用户的提问 + 向量库中检索到的参考资料
 */
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatAlibabaTongyi({
  model: "qwen-max",
  alibabaApiKey: process.env.API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "以我提供的已知参考资料为主，简洁和专业的回答用户问题。参考资料:{context}。"],
  ["user", "用户提问: {input}"]
]);

// 优化的内存向量存储类（LangChain.js 官方未提供 InMemoryVectorStore）
class SimpleVectorStore {
  private documents: Map<string, { doc: Document; embedding: number[] }> = new Map();
  private embeddings: {
    embedQuery: (text: string) => Promise<number[]>;
  };

  constructor(embeddings: {
    embedQuery: (text: string) => Promise<number[]>;
  }) {
    this.embeddings = embeddings;
  }

  async addDocuments(docs: Document[], ids?: string[]): Promise<void> {
    const documentIds = ids || docs.map((_, i) => `id${i + 1}`);
    
    for (let i = 0; i < docs.length; i++) {
      const embedding = await this.embeddings.embedQuery(docs[i].pageContent);
      this.documents.set(documentIds[i], { doc: docs[i], embedding });
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

const embeddings = new AlibabaTongyiEmbeddings({
  modelName: "text-embedding-v1",
  apiKey: process.env.API_KEY,
});

const vectorStore = new SimpleVectorStore(embeddings);

// 打印提示词的函数
function printPrompt(prompt: any): any {
  console.log(prompt.toString());
  console.log("=".repeat(20));
  return prompt;
}

// 主函数
async function main() {
  // 添加更多文档
  await vectorStore.addDocuments([
    new Document({ pageContent: "游泳可以锻炼全身肌肉", metadata: { source: "exercise" } }),
    new Document({ pageContent: "每天喝足够的水很重要", metadata: { source: "health" } }),
    new Document({ pageContent: "睡眠不足会影响减肥效果", metadata: { source: "health" } }),
    new Document({ pageContent: "蛋白质是肌肉修复的重要营养", metadata: { source: "nutrition" } }),
    new Document({ pageContent: "碳水化合物是身体的主要能量来源", metadata: { source: "nutrition" } }),
  ]);
  
  console.log("已添加 5 个文档到向量存储");

  const inputText = "怎么减肥？";

  // 检索向量库
  const result = await vectorStore.similaritySearch(inputText, 2);

  // 构建参考文本
  let referenceText = "[";
  for (const doc of result) {
    referenceText += doc.pageContent;
  }
  referenceText += "]";

  // chain
  const chain = prompt.pipe(printPrompt).pipe(model).pipe(new StringOutputParser());

  const res = await chain.invoke({ input: inputText, context: referenceText });
  console.log(res);
}

main().catch(console.error);