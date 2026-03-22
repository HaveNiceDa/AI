import { HelloAgentsLLM } from "./llm.ts";
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 加载 .env 文件中的环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, '..', '..', '..', '.env');

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

// --- 1. 规划器 (Planner) 定义 ---
const PLANNER_PROMPT_TEMPLATE = `
你是一个顶级的AI规划专家。你的任务是将用户提出的复杂问题分解成一个由多个简单步骤组成的行动计划。
请确保计划中的每个步骤都是一个独立的、可执行的子任务，并且严格按照逻辑顺序排列。
你的输出必须是一个TypeScript数组，其中每个元素都是一个描述子任务的字符串。

问题: {question}

请严格按照以下格式输出你的计划，typescript与作为前后缀是必要的:
typescript
["步骤1", "步骤2", "步骤3"]

`;

class Planner {
  private llmClient: HelloAgentsLLM;

  constructor(llmClient: HelloAgentsLLM) {
    this.llmClient = llmClient;
  }

  async plan(question: string): Promise<string[]> {
    const prompt = PLANNER_PROMPT_TEMPLATE.replace("{question}", question);
    const messages = [{ role: "user", content: prompt }];
    
    console.log("--- 正在生成计划 ---");
    const responseText = await this.llmClient.think(messages) || "";
    console.log(`✅ 计划已生成:\n${responseText}`);
    
    try {
      // 提取TypeScript代码块
      const planStr = responseText.split("typescript")[1].trim();
      // 替换单引号为双引号，确保JSON格式正确
      const jsonStr = planStr.replace(/'/g, '"');
      const plan = JSON.parse(jsonStr);
      return Array.isArray(plan) ? plan : [];
    } catch (e) {
      console.log(`❌ 解析计划时出错: ${e}`);
      console.log(`原始响应: ${responseText}`);
      return [];
    }
  }
}

// --- 3. 执行器 (Executor) 定义 ---
const EXECUTOR_PROMPT_TEMPLATE = `
你是一位顶级的AI执行专家。你的任务是严格按照给定的计划，一步步地解决问题。
你将收到原始问题、完整的计划、以及到目前为止已经完成的步骤和结果。
请你专注于解决“当前步骤”，并仅输出该步骤的最终答案，不要输出任何额外的解释或对话。

# 原始问题:
{question}

# 完整计划:
{plan}

# 历史步骤与结果:
{history}

# 当前步骤:
{current_step}

请仅输出针对“当前步骤”的回答:
`;

class Executor {
  private llmClient: HelloAgentsLLM;

  constructor(llmClient: HelloAgentsLLM) {
    this.llmClient = llmClient;
  }

  async execute(question: string, plan: string[]): Promise<string> {
    let history = "";
    let finalAnswer = "";
    
    console.log("\n--- 正在执行计划 ---");
    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      console.log(`\n-> 正在执行步骤 ${i + 1}/${plan.length}: ${step}`);
      const prompt = EXECUTOR_PROMPT_TEMPLATE
        .replace("{question}", question)
        .replace("{plan}", plan.join("\n"))
        .replace("{history}", history || "无")
        .replace("{current_step}", step);
      
      const messages = [{ role: "user", content: prompt }];
      const responseText = await this.llmClient.think(messages) || "";
      
      history += `步骤 ${i + 1}: ${step}\n结果: ${responseText}\n\n`;
      finalAnswer = responseText;
      console.log(`✅ 步骤 ${i + 1} 已完成，结果: ${finalAnswer}`);
    }
    
    return finalAnswer;
  }
}

// --- 4. 智能体 (Agent) 整合 ---
class PlanAndSolveAgent {
  private llmClient: HelloAgentsLLM;
  private planner: Planner;
  private executor: Executor;

  constructor(llmClient: HelloAgentsLLM) {
    this.llmClient = llmClient;
    this.planner = new Planner(this.llmClient);
    this.executor = new Executor(this.llmClient);
  }

  async run(question: string): Promise<void> {
    console.log(`\n--- 开始处理问题 ---\n问题: ${question}`);
    const plan = await this.planner.plan(question);
    if (plan.length === 0) {
      console.log("\n--- 任务终止 --- \n无法生成有效的行动计划。");
      return;
    }
    const finalAnswer = await this.executor.execute(question, plan);
    console.log(`\n--- 任务完成 ---\n最终答案: ${finalAnswer}`);
  }
}

// --- 5. 主函数入口 --- 
async function main() {
  try {
    const llmClient = new HelloAgentsLLM();
    const agent = new PlanAndSolveAgent(llmClient);
    const question = "一个水果店周一卖出了15个苹果。周二卖出的苹果数量是周一的两倍。周三卖出的数量比周二少了5个。请问这三天总共卖出了多少个苹果？";
    await agent.run(question);
  } catch (e) {
    console.error(e);
  }
}

// 运行主函数
main();
