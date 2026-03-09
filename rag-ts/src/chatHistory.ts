import * as fs from "fs";
import * as path from "path";
import { BaseMessage } from "@langchain/core/messages";
import { BaseChatMessageHistory } from "@langchain/core/chat_history";

interface MessageDict {
  type: string;
  data: Record<string, any>;
}

function messageToDict(message: BaseMessage): MessageDict {
  return {
    type: message._getType(),
    data: {
      content: message.content,
      additional_kwargs: message.additional_kwargs,
      response_metadata: message.response_metadata,
      id: message.id,
      name: message.name,
    },
  };
}

async function messagesFromDict(
  messages: MessageDict[],
): Promise<BaseMessage[]> {
  const { HumanMessage, AIMessage, SystemMessage } =
    await import("@langchain/core/messages");

  return messages.map((msg) => {
    const { type, data } = msg;
    switch (type) {
      case "human":
        return new HumanMessage(data.content);
      case "ai":
        return new AIMessage(data.content);
      case "system":
        return new SystemMessage(data.content);
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  });
}

export class FileChatMessageHistory extends BaseChatMessageHistory {
  lc_namespace = ["langchain", "chat_history", "file"];

  private sessionId: string;
  private storagePath: string;
  private filePath: string;

  constructor(sessionId: string, storagePath: string) {
    super();
    this.sessionId = sessionId;
    this.storagePath = storagePath;
    this.filePath = path.join(this.storagePath, this.sessionId);

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async addMessage(message: BaseMessage): Promise<void> {
    await this.addMessages([message]);
  }

  async addUserMessage(message: string): Promise<void> {
    const { HumanMessage } = await import("@langchain/core/messages");
    await this.addMessage(new HumanMessage(message));
  }

  async addAIMessage(message: string): Promise<void> {
    const { AIMessage } = await import("@langchain/core/messages");
    await this.addMessage(new AIMessage(message));
  }

  async addAIChatMessage(message: string): Promise<void> {
    const { AIMessage } = await import("@langchain/core/messages");
    await this.addMessage(new AIMessage(message));
  }

  async addMessages(messages: BaseMessage[]): Promise<void> {
    // 先获取现有的消息
    const existingMessages = await this.getMessages();
    // 合并现有消息和新消息
    const allMessages = [...existingMessages, ...messages];

    const newMessages: MessageDict[] = allMessages.map(
      (msg) => messageToDict(msg) as MessageDict,
    );

    fs.writeFileSync(
      this.filePath,
      JSON.stringify(newMessages, null, 2),
      "utf-8",
    );
  }

  async getMessages(): Promise<BaseMessage[]> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }

      const data = fs.readFileSync(this.filePath, "utf-8");
      const messagesData: MessageDict[] = JSON.parse(data);
      return await messagesFromDict(messagesData);
    } catch (error) {
      console.error("Error getting messages:", error);
      return [];
    }
  }

  async clear(): Promise<void> {
    fs.writeFileSync(this.filePath, "[]", "utf-8");
  }
}

export function getHistory(sessionId: string): FileChatMessageHistory {
  return new FileChatMessageHistory(sessionId, "./chat_history");
}
