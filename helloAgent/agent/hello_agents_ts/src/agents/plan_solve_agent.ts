import { Agent } from "../core/agent.js";
import { HelloAgentsLLM } from "../core/llm.js";
import { Config } from "../core/config.js";

// 规划器提示词模板
const PLANNER_PROMPT_TEMPLATE = `
你是一个顶级的AI规划专家。你的任务是将用户提出的复杂问题分解成一个由多个简单步骤组成的行动计划。
请确保计划中的每个步骤都是一个独立的、可执行的子任务，并且严格按照逻辑顺序排列。
你的输出必须是一个TypeScript数组，其中每个元素都是一个描述子任务的字符串。

问题: {question}

请严格按照以下格式输出你的计划，typescript与作为前后缀是必要的:
typescript
["步骤1", "步骤2", "步骤3"]
`;

// 执行器提示词模板
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

/**
 * Plan & Solve 代理实现
 */
export class PlanSolveAgent extends Agent {
  max_steps: number;

  constructor(
    name: string,
    llm: HelloAgentsLLM,
    system_prompt?: string,
    config?: Config,
    tool_registry?: any,
    max_steps: number = 5,
  ) {
    super(name, llm, system_prompt, config, tool_registry);
    this.max_steps = max_steps;
  }

  async run(input_text: string, ...args: any[]): Promise<string> {
    console.log(`\n--- 开始处理问题 ---\n问题: ${input_text}`);

    // 1. 生成计划
    const plan = await this._generate_plan(input_text);
    if (plan.length === 0) {
      console.log("\n--- 任务终止 --- \n无法生成有效的行动计划。");
      return "无法生成有效的行动计划";
    }

    // 2. 执行计划
    const final_answer = await this._execute_plan(input_text, plan);
    console.log(`\n--- 任务完成 ---\n最终答案: ${final_answer}`);
    return final_answer;
  }

  private async _generate_plan(question: string): Promise<string[]> {
    console.log("--- 正在生成计划 ---");
    const prompt = PLANNER_PROMPT_TEMPLATE.replace("{question}", question);
    const messages = [{ role: "user", content: prompt }];
    const response_text = await this.llm.think(messages);
    console.log(`✅ 计划已生成:\n${response_text}`);

    try {
      // 提取TypeScript代码块
      const plan_str = response_text.split("typescript")[1].trim();
      // 替换单引号为双引号，确保JSON格式正确
      const json_str = plan_str.replace(/'/g, '"');
      const plan = JSON.parse(json_str);
      return Array.isArray(plan) ? plan : [];
    } catch (e) {
      console.log(`❌ 解析计划时出错: ${e}`);
      console.log(`原始响应: ${response_text}`);
      return [];
    }
  }

  private async _execute_plan(
    question: string,
    plan: string[],
  ): Promise<string> {
    let history = "";
    let final_answer = "";

    console.log("\n--- 正在执行计划 ---");
    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      console.log(`\n-> 正在执行步骤 ${i + 1}/${plan.length}: ${step}`);

      const prompt = EXECUTOR_PROMPT_TEMPLATE.replace("{question}", question)
        .replace("{plan}", plan.join("\n"))
        .replace("{history}", history || "无")
        .replace("{current_step}", step);

      const messages = [{ role: "user", content: prompt }];
      const response_text = await this.llm.think(messages);

      history += `步骤 ${i + 1}: ${step}\n结果: ${response_text}\n\n`;
      final_answer = response_text;
      console.log(`✅ 步骤 ${i + 1} 已完成，结果: ${final_answer}`);
    }

    return final_answer;
  }
}
