import { Agent } from '../core/agent.js';
import { Message } from '../core/message.js';
import { HelloAgentsLLM } from '../core/llm.js';
import { Config } from '../core/config.js';

// ReAct 提示词模板
const REACT_PROMPT_TEMPLATE = `
你是一个智能助手，需要通过思考和行动来回答问题。

可用工具:
{tools}

请按照以下格式输出:
Thought: 你的思考过程
Action: 工具名称[工具输入]

当你获得足够的信息并准备提供最终答案时，请使用以下格式:
Action: Finish[最终答案]

问题:
{question}

历史记录:
{history}
`;

/**
 * ReAct 代理实现
 */
export class ReActAgent extends Agent {
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

  async run(input_text: string, ...args: any[]): Promise<string> {
    let history: string[] = [];

    for (let i = 0; i < this.max_steps; i++) {
      console.log(`--- 第 ${i + 1} 步 ---`);

      // 1. 构建提示词
      const tools_desc = this._get_available_tools();
      const history_str = history.join('\n');
      const prompt = REACT_PROMPT_TEMPLATE
        .replace('{tools}', tools_desc)
        .replace('{question}', input_text)
        .replace('{history}', history_str);

      // 2. 调用 LLM 进行思考
      const messages = [{ role: 'user', content: prompt }];
      const response_text = await this.llm.think(messages);
      console.log(`模型输出: ${response_text}`);

      // 3. 解析 LLM 输出
      const { thought, action } = this._parse_output(response_text);
      
      if (thought) {
        console.log(`思考: ${thought}`);
      }

      if (!action) {
        console.log('警告: 未能解析出有效的 Action，流程终止。');
        break;
      }

      // 4. 执行 Action
      if (action.startsWith('Finish')) {
        const final_answer_match = action.match(/Finish\[(.*)\]/);
        if (final_answer_match) {
          const final_answer = final_answer_match[1];
          console.log(`🎉 最终答案: ${final_answer}`);
          return final_answer;
        }
        break;
      }

      const { tool_name, tool_input } = this._parse_action(action);
      if (!tool_name || !tool_input) {
        console.log('警告: Action 格式不正确，流程终止。');
        break;
      }

      console.log(`🎬 行动: ${tool_name}[${tool_input}]`);

      // 5. 执行工具调用
      const observation = this._execute_tool_call(tool_name, { input: tool_input });
      console.log(`👀 观察: ${observation}`);

      // 6. 更新历史记录
      history.push(`Action: ${action}`);
      history.push(`Observation: ${observation}`);
    }

    console.log('已达到最大步数，流程终止。');
    return '未能找到最终答案';
  }

  private _get_available_tools(): string {
    if (!this.tool_registry) {
      return '无可用工具';
    }

    const tools = this.tool_registry.list_tools() || [];
    return tools.map((tool: any) => `- ${tool}: 工具描述`).join('\n');
  }

  private _parse_output(text: string): { thought: string | null; action: string | null } {
    const thought_match = text.match(/Thought:\s*(.*?)(?=\nAction:|$)/s);
    const action_match = text.match(/Action:\s*(.*?)$/s);
    const thought = thought_match ? thought_match[1].trim() : null;
    const action = action_match ? action_match[1].trim() : null;
    return { thought, action };
  }

  private _parse_action(action_text: string): { tool_name: string | null; tool_input: string | null } {
    const match = action_text.match(/(\w+)\[(.*)\]/s);
    if (match) {
      return { tool_name: match[1], tool_input: match[2] };
    }
    return { tool_name: null, tool_input: null };
  }
}
