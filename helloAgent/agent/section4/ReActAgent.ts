import { ToolExecutor } from "./toolManager.ts";

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

export class ReActAgent {
  private llmClient: any; // 这里应该定义具体的 LLM 客户端类型
  private toolExecutor: ToolExecutor;
  private maxSteps: number;
  private history: string[];

  constructor(llmClient: any, toolExecutor: ToolExecutor, maxSteps: number = 5) {
    this.llmClient = llmClient;
    this.toolExecutor = toolExecutor;
    this.maxSteps = maxSteps;
    this.history = [];
  }

  async run(question: string): Promise<string | null> {
    /**
     * 运行ReAct智能体来回答一个问题。
     */
    this.history = []; // 每次运行时重置历史记录
    let currentStep = 0;

    while (currentStep < this.maxSteps) {
      currentStep++;
      console.log(`--- 第 ${currentStep} 步 ---`);

      // 1. 格式化提示词
      const toolsDesc = this.toolExecutor.getAvailableTools();
      const historyStr = this.history.join("\n");
      const prompt = REACT_PROMPT_TEMPLATE
        .replace("{tools}", toolsDesc)
        .replace("{question}", question)
        .replace("{history}", historyStr);

      // 2. 调用LLM进行思考
      const messages = [{ role: "user", content: prompt }];
      const responseText = await this.llmClient.think(messages);
      
      if (!responseText) {
        console.log("错误:LLM未能返回有效响应。");
        break;
      }

      // 3. 解析LLM的输出
      const { thought, action } = this._parseOutput(responseText);
      
      if (thought) {
        console.log(`思考: ${thought}`);
      }

      if (!action) {
        console.log("警告:未能解析出有效的Action，流程终止。");
        break;
      }

      // 4. 执行Action
      if (action.startsWith("Finish")) {
        // 如果是Finish指令，提取最终答案并结束
        const finalAnswerMatch = action.match(/Finish\[(.*)\]/);
        if (finalAnswerMatch) {
          const finalAnswer = finalAnswerMatch[1];
          console.log(`🎉 最终答案: ${finalAnswer}`);
          return finalAnswer;
        }
        break;
      }
      
      const { toolName, toolInput } = this._parseAction(action);
      if (!toolName || !toolInput) {
        console.log("警告:Action格式不正确，流程终止。");
        break;
      }

      console.log(`🎬 行动: ${toolName}[${toolInput}]`);
      
      const toolFunction = this.toolExecutor.getTool(toolName);
      let observation: string;
      if (!toolFunction) {
        observation = `错误:未找到名为 '${toolName}' 的工具。`;
      } else {
        try {
          observation = await toolFunction(toolInput); // 调用真实工具
        } catch (error) {
          observation = `错误:调用工具时发生错误 - ${error}`;
        }
      }
      
      console.log(`👀 观察: ${observation}`);
      
      // 将本轮的Action和Observation添加到历史记录中
      this.history.push(`Action: ${action}`);
      this.history.push(`Observation: ${observation}`);
    }

    // 循环结束
    console.log("已达到最大步数，流程终止。");
    return null;
  }

  private _parseOutput(text: string): { thought: string | null; action: string | null } {
    /**
     * 解析LLM的输出，提取Thought和Action。
     */
    // Thought: 匹配到 Action: 或文本末尾
    const thoughtMatch = text.match(/Thought:\s*(.*?)(?=\nAction:|$)/s);
    // Action: 匹配到文本末尾
    const actionMatch = text.match(/Action:\s*(.*?)$/s);
    const thought = thoughtMatch ? thoughtMatch[1].trim() : null;
    const action = actionMatch ? actionMatch[1].trim() : null;
    return { thought, action };
  }

  private _parseAction(actionText: string): { toolName: string | null; toolInput: string | null } {
    /**
     * 解析Action字符串，提取工具名称和输入。
     */
    const match = actionText.match(/(\w+)\[(.*)\]/s);
    if (match) {
      return { toolName: match[1], toolInput: match[2] };
    }
    return { toolName: null, toolInput: null };
  }
}
