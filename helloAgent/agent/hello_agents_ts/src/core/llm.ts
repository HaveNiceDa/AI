import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量（从上级目录）
dotenv.config({
  path: resolve(__dirname, '../../../../../.env')
});

/**
 * LLM 客户端类
 */
export class HelloAgentsLLM {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number | undefined;
  private client: any;

  constructor(
    provider: string = 'openai',
    model: string = 'gpt-3.5-turbo',
    temperature: number = 0.7,
    max_tokens?: number
  ) {
    this.provider = provider;
    this.model = model;
    this.temperature = temperature;
    this.max_tokens = max_tokens;

    // 初始化客户端
    this.client = this._initClient();
  }

  private _initClient(): any {
    if (this.provider === 'openai') {
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL
      });
    }
    // 可以添加其他 provider 的初始化逻辑
    throw new Error(`Unsupported provider: ${this.provider}`);
  }

  async invoke(messages: any[], temperature?: number, max_tokens?: number): Promise<string> {
    const params = {
      model: this.model,
      messages,
      temperature: temperature || this.temperature,
      max_tokens: max_tokens || this.max_tokens
    };

    try {
      const response = await this.client.chat.completions.create(params);
      return response.choices[0].message?.content || '';
    } catch (error) {
      console.error('LLM invoke error:', error);
      throw error;
    }
  }

  async think(messages: any[]): Promise<string> {
    return this.invoke(messages);
  }

  async generate(prompt: string, system_prompt: string): Promise<string> {
    const messages = [
      { role: 'system', content: system_prompt },
      { role: 'user', content: prompt }
    ];
    return this.invoke(messages);
  }
}
