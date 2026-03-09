import {
  BaseChatModel,
  type BaseChatModelParams,
} from "@langchain/core/language_models/chat_models";
import {
  BaseMessage,
  AIMessage,
  AIMessageChunk,
  HumanMessage,
} from "@langchain/core/messages";
import { ChatResult, ChatGenerationChunk } from "@langchain/core/outputs";

export class ChatTongyi extends BaseChatModel {
  private apiKey: string;
  private model: string;

  constructor(
    fields: { apiKey?: string; model?: string } & BaseChatModelParams = {},
  ) {
    super(fields);
    this.apiKey = fields.apiKey || process.env.DASHSCOPE_API_KEY || "";
    this.model = fields.model || "qwen3-max";
  }

  _llmType(): string {
    return "tongyi";
  }

  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    const formattedMessages = messages.map((msg) => {
      let msgType = msg._getType();
      // 映射角色：human -> user, ai -> assistant
      let role =
        msgType === "human" ? "user" : msgType === "ai" ? "assistant" : msgType;
      return {
        role,
        content: msg.content,
      };
    });

    const response = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`DashScope API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices[0].message.content;

    const aiMessage = new AIMessage(content);

    return {
      generations: [
        {
          message: aiMessage,
          text: content,
        },
      ],
      llmOutput: data,
    };
  }

  async *_streamResponseChunks(messages: BaseMessage[]): AsyncGenerator<any> {
    const formattedMessages = messages.map((msg) => {
      let msgType = msg._getType();
      let role =
        msgType === "human" ? "user" : msgType === "ai" ? "assistant" : msgType;
      return {
        role,
        content: msg.content,
      };
    });

    const response = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DashScope API error: ${response.statusText}\n${errorText}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.choices && parsed.choices[0]?.delta?.content) {
              const content = parsed.choices[0].delta.content;
              const chunkId = parsed.id || `chunk-${Date.now()}`;
              const aiMessageChunk = new AIMessageChunk({
                content,
                id: chunkId,
              });

              const generationChunk = new ChatGenerationChunk({
                text: content,
                message: aiMessageChunk,
                generationInfo: parsed,
              });

              yield generationChunk;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}
