import dotenv from 'dotenv';
import OpenAI from 'openai';

// 加载 .env 文件中的环境变量
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envFilePath });


type Message = {
  role: string;
  content: string;
};

export class HelloAgentsLLM {
  /**
   * 为本书 "Hello Agents" 定制的LLM客户端。
   * 它用于调用任何兼容OpenAI接口的服务，并默认使用流式响应。
   */
  private model: string;
  private client: OpenAI;

  constructor(model?: string, apiKey?: string, baseUrl?: string, timeout?: number) {
    /**
     * 初始化客户端。优先使用传入参数，如果未提供，则从环境变量加载。
     */
    this.model = model || process.env.LLM_MODEL_ID as string;
    const apiKeyValue = apiKey || process.env.LLM_API_KEY as string;
    const baseUrlValue = baseUrl || process.env.LLM_BASE_URL as string;
    const timeoutValue = timeout || parseInt(process.env.LLM_TIMEOUT || '60');
    
    if (!this.model || !apiKeyValue || !baseUrlValue) {
      throw new Error('模型ID、API密钥和服务地址必须被提供或在.env文件中定义。');
    }

    this.client = new OpenAI({
      apiKey: apiKeyValue,
      baseURL: baseUrlValue,
      timeout: timeoutValue * 1000, // OpenAI SDK expects timeout in milliseconds
    });
  }

  async think(messages: Message[], temperature: number = 0): Promise<string | null> {
    /**
     * 调用大语言模型进行思考，并返回其响应。
     */
    console.log(`🧠 正在调用 ${this.model} 模型...`);
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as OpenAI.ChatCompletionMessageParam[],
        temperature: temperature,
        stream: true,
      });
      
      // 处理流式响应
      console.log('✅ 大语言模型响应成功:');
      const collectedContent: string[] = [];
      for await (const chunk of response) {
        const content = chunk.choices[0].delta.content || '';
        process.stdout.write(content);
        collectedContent.push(content);
      }
      console.log(); // 在流式输出结束后换行
      return collectedContent.join('');

    } catch (e) {
      console.error(`❌ 调用LLM API时发生错误: ${e}`);
      return null;
    }
  }
}

// --- 客户端使用示例 ---
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const llmClient = new HelloAgentsLLM();
      
      const exampleMessages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant that writes TypeScript code.' },
        { role: 'user', content: '写一个快速排序算法' }
      ];
      
      console.log('--- 调用LLM ---');
      const responseText = await llmClient.think(exampleMessages);
      if (responseText) {
        console.log('\n\n--- 完整模型响应 ---');
        console.log(responseText);
      }

    } catch (e) {
      console.error(e);
    }
  })();
}
