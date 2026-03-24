import { Agent } from '../core/agent.js';
import { Message } from '../core/message.js';
import { HelloAgentsLLM } from '../core/llm.js';
import { Config } from '../core/config.js';

/**
 * 简单代理实现 - 基于 Function Calling
 */
export class SimpleAgent extends Agent {
  max_steps: number;

  constructor(
    name: string,
    llm: HelloAgentsLLM,
    system_prompt?: string,
    config?: Config,
    tool_registry?: any,
    max_steps: number = 5
  ) {
    super(name, llm, system_prompt, config, tool_registry);
    this.max_steps = max_steps;
  }

  run(input_text: string, ...args: any[]): string {
    // 简单实现：直接调用 LLM
    const messages = [
      { role: 'system', content: this.system_prompt || '你是一个 helpful 的助手' },
      { role: 'user', content: input_text }
    ];

    const result = this.llm.think(messages);
    return result;
  }

  async arun(input_text: string, ...args: any[]): Promise<string> {
    const messages = [
      { role: 'system', content: this.system_prompt || '你是一个 helpful 的助手' },
      { role: 'user', content: input_text }
    ];

    const result = await this.llm.think(messages);
    return result;
  }
}
