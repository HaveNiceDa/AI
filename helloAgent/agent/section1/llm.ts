interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class OpenAICompatibleClient {
  private model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(model: string, apiKey: string, baseUrl: string) {
    this.model = model;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async generate(prompt: string, systemPrompt: string): Promise<string> {
    console.log("正在调用大语言模型...");
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatCompletionResponse = await response.json();
      const answer = data.choices[0].message.content;
      console.log("大语言模型响应成功。");
      return answer;
    } catch (error) {
      console.error(`调用LLM API时发生错误: ${error}`);
      return "错误:调用语言模型服务时出错。";
    }
  }
}
