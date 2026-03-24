import { Agent } from '../core/agent.js';
import { HelloAgentsLLM } from '../core/llm.js';
import { Config } from '../core/config.js';

// 初始执行提示词
const INITIAL_PROMPT_TEMPLATE = `你是一位资深的TypeScript程序员。请根据以下要求，编写一个TypeScript函数。
你的代码必须包含完整的函数签名、文档字符串，并遵循TypeScript编码规范。

要求: {task}

请直接输出代码，不要包含任何额外的解释。`;

// 反思提示词
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

// 优化提示词
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

/**
 * 记忆模块
 */
class Memory {
  private records: { type: string; content: string }[];

  constructor() {
    this.records = [];
  }

  addRecord(recordType: string, content: string): void {
    this.records.push({ type: recordType, content });
    console.log(`📝 记忆已更新，新增一条 '${recordType}' 记录。`);
  }

  getLastExecution(): string | null {
    for (let i = this.records.length - 1; i >= 0; i--) {
      if (this.records[i].type === 'execution') {
        return this.records[i].content;
      }
    }
    return null;
  }
}

/**
 * Reflection 代理实现
 */
export class ReflectionAgent extends Agent {
  max_iterations: number;
  memory: Memory;

  constructor(
    name: string,
    llm: HelloAgentsLLM,
    system_prompt?: string,
    config?: Config,
    tool_registry?: any,
    max_iterations: number = 3
  ) {
    super(name, llm, system_prompt, config, tool_registry);
    this.max_iterations = max_iterations;
    this.memory = new Memory();
  }

  async run(input_text: string, ...args: any[]): Promise<string> {
    console.log(`\n--- 开始处理任务 ---\n任务: ${input_text}`);

    // 1. 初始执行
    console.log('\n--- 正在进行初始尝试 ---');
    const initial_prompt = INITIAL_PROMPT_TEMPLATE.replace('{task}', input_text);
    const initial_code = await this._get_llm_response(initial_prompt);
    this.memory.addRecord('execution', initial_code);

    // 2. 迭代循环：反思与优化
    for (let i = 0; i < this.max_iterations; i++) {
      console.log(`\n--- 第 ${i + 1}/${this.max_iterations} 轮迭代 ---`);

      // a. 反思
      console.log('\n-> 正在进行反思...');
      const last_code = this.memory.getLastExecution();
      if (!last_code) {
        console.log('错误：未找到上一轮执行的代码。');
        break;
      }
      const reflect_prompt = REFLECT_PROMPT_TEMPLATE
        .replace('{task}', input_text)
        .replace('{code}', last_code);
      const feedback = await this._get_llm_response(reflect_prompt);
      this.memory.addRecord('reflection', feedback);

      // b. 检查是否需要停止
      if (feedback.includes('无需改进') || feedback.toLowerCase().includes('no need for improvement')) {
        console.log('\n✅ 反思认为代码已无需改进，任务完成。');
        break;
      }

      // c. 优化
      console.log('\n-> 正在进行优化...');
      const refine_prompt = REFINE_PROMPT_TEMPLATE
        .replace('{task}', input_text)
        .replace('{last_code_attempt}', last_code)
        .replace('{feedback}', feedback);
      const refined_code = await this._get_llm_response(refine_prompt);
      this.memory.addRecord('execution', refined_code);
    }

    const final_code = this.memory.getLastExecution();
    if (final_code) {
      console.log(`\n--- 任务完成 ---\n最终生成的代码:\n${final_code}`);
    } else {
      console.log('\n--- 任务失败 ---\n未能生成最终代码。');
    }
    return final_code || '未能生成最终代码';
  }

  private async _get_llm_response(prompt: string): Promise<string> {
    const messages = [{ role: 'user', content: prompt }];
    const response_text = await this.llm.think(messages) || '';
    return response_text;
  }
}
