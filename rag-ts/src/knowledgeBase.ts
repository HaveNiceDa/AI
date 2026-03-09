import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { DashScopeEmbeddings } from "./embeddings";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { VectorStoreService } from "./vectorStore";
import { config } from "./config";

export function checkMd5(md5Str: string): boolean {
  if (!fs.existsSync(config.md5Path)) {
    fs.writeFileSync(config.md5Path, "", "utf-8");
    return false;
  }

  const lines = fs.readFileSync(config.md5Path, "utf-8").split("\n");
  return lines.some((line) => line.trim() === md5Str);
}

export function saveMd5(md5Str: string): void {
  fs.appendFileSync(config.md5Path, md5Str + "\n", "utf-8");
}

export function getStringMd5(
  inputStr: string,
  encoding: BufferEncoding = "utf-8",
): string {
  const strBytes = Buffer.from(inputStr, encoding);
  const md5Obj = crypto.createHash("md5");
  md5Obj.update(strBytes);
  return md5Obj.digest("hex");
}

export class KnowledgeBaseService {
  private vectorStore: MemoryVectorStore;
  private splitter: RecursiveCharacterTextSplitter;
  private vectorService: VectorStoreService;

  constructor() {
    if (!fs.existsSync(config.chroma.persistDirectory)) {
      fs.mkdirSync(config.chroma.persistDirectory, { recursive: true });
    }

    const embedding = new DashScopeEmbeddings({
      model: config.embeddingModelName,
    });

    this.vectorStore = new MemoryVectorStore(embedding);

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.splitter.chunkSize,
      chunkOverlap: config.splitter.chunkOverlap,
      separators: config.splitter.separators,
    });

    this.vectorService = new VectorStoreService(embedding);
  }

  async uploadByStr(data: string, filename: string): Promise<string> {
    const md5Hex = getStringMd5(data);

    if (checkMd5(md5Hex)) {
      return "[跳过]内容已经存在知识库中";
    }

    let knowledgeChunks: string[];
    if (data.length > config.splitter.maxSplitCharNumber) {
      knowledgeChunks = await this.splitter.splitText(data);
    } else {
      knowledgeChunks = [data];
    }

    const metadata = {
      source: filename,
      createTime: new Date().toISOString().replace("T", " ").substring(0, 19),
      operator: "小曹",
    };

    const metadatas = knowledgeChunks.map(() => ({ ...metadata }));

    await this.vectorStore.addDocuments(
      knowledgeChunks.map((text, i) => ({
        pageContent: text,
        metadata: metadatas[i],
      })),
    );

    await this.vectorService.addTexts(knowledgeChunks, metadatas);

    saveMd5(md5Hex);

    return "[成功]内容已经成功载入向量库";
  }
}
