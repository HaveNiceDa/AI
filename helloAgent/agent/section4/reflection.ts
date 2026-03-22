import { HelloAgentsLLM } from "./llm.ts";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// 加载 .env 文件中的环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, "..", "..", "..", ".env");

try {
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
  } else {
    console.log("警告：未找到 .env 文件，将使用系统环境变量。");
    dotenv.config();
  }
} catch (e) {
  console.log(`警告：加载 .env 文件时出错: ${e}`);
  dotenv.config();
}

// --- 模块 1: 记忆模块 ---

interface MemoryRecord {
  type: string;
  content: string;
}

class Memory {
  /**
   * 一个简单的短期记忆模块，用于存储智能体的行动与反思轨迹。
   */
  private records: MemoryRecord[];

  constructor() {
    // 初始化一个空列表来存储所有记录
    this.records = [];
  }

  addRecord(recordType: string, content: string): void {
    /**
     * 向记忆中添加一条新记录。
     *
     * 参数:
     * - recordType (string): 记录的类型 ('execution' 或 'reflection')。
     * - content (string): 记录的具体内容 (例如，生成的代码或反思的反馈)。
     */
    this.records.push({ type: recordType, content });
    console.log(`📝 记忆已更新，新增一条 '${recordType}' 记录。`);
  }

  getTrajectory(): string {
    /**
     * 将所有记忆记录格式化为一个连贯的字符串文本，用于构建提示词。
     */
    let trajectory = "";
    for (const record of this.records) {
      if (record.type === "execution") {
        trajectory += `--- 上一轮尝试 (代码) --\n${record.content}\n\n`;
      } else if (record.type === "reflection") {
        trajectory += `--- 评审员反馈 --\n${record.content}\n\n`;
      }
    }
    return trajectory.trim();
  }

  getLastExecution(): string | null {
    /**
     * 获取最近一次的执行结果 (例如，最新生成的代码)。
     */
    for (let i = this.records.length - 1; i >= 0; i--) {
      if (this.records[i].type === "execution") {
        return this.records[i].content;
      }
    }
    return null;
  }
}

// --- 模块 2: Reflection 智能体 ---

// 1. 初始执行提示词
const INITIAL_PROMPT_TEMPLATE = `你是一位资深的TypeScript程序员。请根据以下要求，编写一个TypeScript函数。
你的代码必须包含完整的函数签名、文档字符串，并遵循TypeScript编码规范。

要求: {task}

请直接输出代码，不要包含任何额外的解释。`;

// 2. 反思提示词
const REFLECT_PROMPT_TEMPLATE = `你是一位极其严格的代码评审专家和资深算法工程师，对代码的性能有极致的要求。
你的任务是审查以下TypeScript代码，并专注于找出其在**算法效率**上的主要瓶颈。

# 原始任务:
{task}

# 待审查的代码:
\`\`\`typescript
{code}
\`\`\`

请分析该代码的时间复杂度，并思考是否存在一种**算法上更优**的解决方案来显著提升性能。
如果存在，请清晰地指出当前算法的不足，并提出具体的、可行的改进算法建议（例如，使用筛法替代试除法）。
如果代码在算法层面已经达到最优，才能回答“无需改进”。

请直接输出你的反馈，不要包含任何额外的解释。`;

// 3. 优化提示词
const REFINE_PROMPT_TEMPLATE = `你是一位资深的TypeScript程序员。你正在根据一位代码评审专家的反馈来优化你的代码。

# 原始任务:
{task}

# 你上一轮尝试的代码:
{last_code_attempt}

# 评审员的反馈:
{feedback}

请根据评审员的反馈，生成一个优化后的新版本代码。
你的代码必须包含完整的函数签名、文档字符串，并遵循TypeScript编码规范。
请直接输出优化后的代码，不要包含任何额外的解释。`;

class ReflectionAgent {
  private llmClient: HelloAgentsLLM;
  private memory: Memory;
  private maxIterations: number;

  constructor(llmClient: HelloAgentsLLM, maxIterations: number = 3) {
    this.llmClient = llmClient;
    this.memory = new Memory();
    this.maxIterations = maxIterations;
  }

  async run(task: string): Promise<string | null> {
    console.log(`\n--- 开始处理任务 ---\n任务: ${task}`);

    // --- 1. 初始执行 ---
    console.log("\n--- 正在进行初始尝试 ---");
    const initialPrompt = INITIAL_PROMPT_TEMPLATE.replace("{task}", task);
    const initialCode = await this._getLLMResponse(initialPrompt);
    this.memory.addRecord("execution", initialCode);

    // --- 2. 迭代循环：反思与优化 ---
    for (let i = 0; i < this.maxIterations; i++) {
      console.log(`\n--- 第 ${i + 1}/${this.maxIterations} 轮迭代 ---`);

      // a. 反思
      console.log("\n-> 正在进行反思...");
      const lastCode = this.memory.getLastExecution();
      if (!lastCode) {
        console.log("错误：未找到上一轮执行的代码。");
        break;
      }
      const reflectPrompt = REFLECT_PROMPT_TEMPLATE.replace(
        "{task}",
        task,
      ).replace("{code}", lastCode);
      const feedback = await this._getLLMResponse(reflectPrompt);
      this.memory.addRecord("reflection", feedback);

      // b. 检查是否需要停止
      if (
        feedback.includes("无需改进") ||
        feedback.toLowerCase().includes("no need for improvement")
      ) {
        console.log("\n✅ 反思认为代码已无需改进，任务完成。");
        break;
      }

      // c. 优化
      console.log("\n-> 正在进行优化...");
      const refinePrompt = REFINE_PROMPT_TEMPLATE.replace("{task}", task)
        .replace("{last_code_attempt}", lastCode)
        .replace("{feedback}", feedback);
      const refinedCode = await this._getLLMResponse(refinePrompt);
      this.memory.addRecord("execution", refinedCode);
    }

    const finalCode = this.memory.getLastExecution();
    if (finalCode) {
      console.log(`\n--- 任务完成 ---\n最终生成的代码:\n${finalCode}`);
    } else {
      console.log("\n--- 任务失败 ---\n未能生成最终代码。");
    }
    return finalCode;
  }

  private async _getLLMResponse(prompt: string): Promise<string> {
    /**
     * 一个辅助方法，用于调用LLM并获取完整的流式响应。
     */
    const messages = [{ role: "user", content: prompt }];
    // 确保能处理生成器可能返回None的情况
    const responseText = (await this.llmClient.think(messages)) || "";
    return responseText;
  }
}

// --- 主函数入口 ---
async function main() {
  try {
    // 1. 初始化LLM客户端
    const llmClient = new HelloAgentsLLM();

    // 2. 初始化 Reflection 智能体，设置最多迭代2轮
    const agent = new ReflectionAgent(llmClient, 2);

    // 3. 定义任务并运行智能体
    const task =
      "编写一个TypeScript函数，找出1到n之间所有的素数 (prime numbers)。";
    await agent.run(task);
  } catch (e) {
    console.error(`初始化LLM客户端时出错: ${e}`);
  }
}

// 运行主函数
main();
