import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnablePassthrough,
  RunnableWithMessageHistory,
} from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatTongyi } from "./chatModels";
import { DashScopeEmbeddings } from "./embeddings";
import { VectorStoreService } from "./vectorStore";
import { getHistory } from "./chatHistory";
import { config } from "./config";
import type { RunnableConfig } from "@langchain/core/runnables";

type ChainInput = { input: string };
type ChainOutput = string;

function printPrompt(prompt: ChatPromptTemplate): ChatPromptTemplate {
  console.log("=".repeat(20));
  console.log(prompt.toString());
  console.log("=".repeat(20));
  return prompt;
}

function formatDocument(docs: Document[]): string {
  if (!docs || docs.length === 0) {
    return "无相关参考资料";
  }

  return docs
    .map(
      (doc) =>
        `文档片段：${doc.pageContent}\n文档元数据：${JSON.stringify(doc.metadata)}\n\n`,
    )
    .join("");
}

function formatForRetriever(value: Record<string, any>): string {
  return value.input;
}

function formatForPromptTemplate(
  value: Record<string, any>,
): Record<string, any> {
  return {
    input: value.input,
    context: value.context,
    history: value.history || [],
  };
}

export class RagService {
  private vectorService: VectorStoreService;
  private promptTemplate: ChatPromptTemplate;
  private chatModel: ChatTongyi;
  public chain: RunnableWithMessageHistory<ChainInput, ChainOutput>;

  constructor() {
    const embedding = new DashScopeEmbeddings({
      model: config.embeddingModelName,
    });

    this.vectorService = new VectorStoreService(embedding);

    this.promptTemplate = ChatPromptTemplate.fromMessages([
      [
        "system",
        "以我提供的已知参考资料为主，简洁和专业的回答用户问题。参考资料:{context}。",
      ],
      ["system", "并且我提供用户的对话历史记录，如下："],
      new MessagesPlaceholder("history"),
      ["user", "请回答用户提问：{input}"],
    ]);

    this.chatModel = new ChatTongyi({
      model: config.chatModelName,
    });

    this.chain = this.getChain();
  }

  private getChain(): RunnableWithMessageHistory<ChainInput, ChainOutput> {
    const retriever = this.vectorService.getRetriever();

    const chain = RunnablePassthrough.assign({
      context: (value: Record<string, any>) => {
        const query = value.input;
        return retriever.invoke(query).then(formatDocument);
      },
    })
      .pipe((value: Record<string, any>) => formatForPromptTemplate(value))
      .pipe(this.promptTemplate)
      .pipe(this.chatModel)
      .pipe(new StringOutputParser());

    const conversationChain = new RunnableWithMessageHistory<
      ChainInput,
      ChainOutput
    >({
      runnable: chain,
      getMessageHistory: getHistory,
      inputMessagesKey: "input",
      historyMessagesKey: "history",
    });

    return conversationChain;
  }

  async stream(
    input: string,
    config: RunnableConfig,
  ): Promise<AsyncIterable<string>> {
    const chainInput = { input };
    const result = await this.chain.stream(chainInput, config);
    return result;
  }
}
