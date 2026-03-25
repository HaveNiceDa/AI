import {
  SimpleAgent,
  HelloAgentsLLM,
  Config,
  Message,
} from "../hello_agents_ts/src/index.js";
import { ToolRegistry } from "../hello_agents_ts/src/tools/registry.js";

/**
 * 重写的简单对话Agent
 * 展示如何基于框架基类构建自定义Agent
 */
export class MySimpleAgent extends SimpleAgent {
  private toolRegistry: ToolRegistry | null;
  private enableToolCalling: boolean;

  constructor(
    name: string,
    llm: HelloAgentsLLM,
    systemPrompt?: string,
    config?: Config,
    toolRegistry?: ToolRegistry,
    enableToolCalling: boolean = true,
  ) {
    super(name, llm, systemPrompt, config);
    this.toolRegistry = toolRegistry || null;
    this.enableToolCalling = enableToolCalling && toolRegistry !== undefined;
    console.log(
      `✅ ${name} 初始化完成，工具调用: ${this.enableToolCalling ? "启用" : "禁用"}`,
    );
  }

  async run(
    inputText: string,
    maxToolIterations: number = 3,
    ...args: any[]
  ): Promise<string> {
    /**
     * 重写的运行方法 - 实现简单对话逻辑，支持可选工具调用
     */
    console.log(`🤖 ${this.name} 正在处理: ${inputText}`);

    // 构建消息列表
    const messages: any[] = [];

    // 添加系统消息（可能包含工具信息）
    const enhancedSystemPrompt = this._getEnhancedSystemPrompt();
    messages.push({ role: "system", content: enhancedSystemPrompt });

    // 添加历史消息
    for (const msg of this.get_history()) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // 添加当前用户消息
    messages.push({ role: "user", content: inputText });

    // 如果没有启用工具调用，使用简单对话逻辑
    if (!this.enableToolCalling) {
      const response = await this.llm.invoke(messages, ...args);
      this.add_message(new Message(inputText, "user"));
      this.add_message(new Message(response, "assistant"));
      console.log(`✅ ${this.name} 响应完成`);
      return response;
    }

    // 支持多轮工具调用的逻辑
    return this._runWithTools(messages, inputText, maxToolIterations, ...args);
  }

  private _getEnhancedSystemPrompt(): string {
    /**构建增强的系统提示词，包含工具信息*/
    const basePrompt = this.system_prompt || "你是一个有用的AI助手。";

    if (!this.enableToolCalling || !this.toolRegistry) {
      return basePrompt;
    }

    // 获取工具列表
    const toolNames = this.toolRegistry.listTools();
    if (toolNames.length === 0) {
      return basePrompt;
    }

    let toolsSection = "\n\n## 可用工具\n";
    toolsSection += "你可以使用以下工具来帮助回答问题：\n";
    for (const toolName of toolNames) {
      const tool = this.toolRegistry.getTool(toolName);
      if (tool) {
        toolsSection += `- ${toolName}: ${tool.description || "无描述"}\n`;
      }
    }

    toolsSection += "\n## 工具调用格式\n";
    toolsSection += "当需要使用工具时，请使用以下格式：\n";
    toolsSection += "`[TOOL_CALL:{tool_name}:{parameters}]`\n";
    toolsSection += "例如：`[TOOL_CALL:calculator:15 * 8 + 32]`\n\n";
    toolsSection +=
      "工具调用结果会自动插入到对话中，然后你可以基于结果继续回答。\n";

    return basePrompt + toolsSection;
  }

  private async _runWithTools(
    messages: any[],
    inputText: string,
    maxToolIterations: number,
    ...args: any[]
  ): Promise<string> {
    /**支持工具调用的运行逻辑*/
    let currentIteration = 0;
    let finalResponse = "";

    while (currentIteration < maxToolIterations) {
      // 调用LLM
      const response = await this.llm.invoke(messages, ...args);

      // 检查是否有工具调用
      const toolCalls = this._parseToolCalls(response);

      if (toolCalls.length > 0) {
        console.log(`🔧 检测到 ${toolCalls.length} 个工具调用`);
        // 执行所有工具调用并收集结果
        const toolResults: string[] = [];
        let cleanResponse = response;

        for (const call of toolCalls) {
          const result = await this._executeToolCall(
            call.toolName,
            call.parameters,
          );
          toolResults.push(result);
          // 从响应中移除工具调用标记
          cleanResponse = cleanResponse.replace(call.original, "");
        }

        // 构建包含工具结果的消息
        messages.push({ role: "assistant", content: cleanResponse });

        // 添加工具结果
        const toolResultsText = toolResults.join("\n\n");
        messages.push({
          role: "user",
          content: `工具执行结果：\n${toolResultsText}\n\n请基于这些结果给出完整的回答。`,
        });

        currentIteration++;
        continue;
      }

      // 没有工具调用，这是最终回答
      finalResponse = response;
      break;
    }

    // 如果超过最大迭代次数，获取最后一次回答
    if (currentIteration >= maxToolIterations && !finalResponse) {
      finalResponse = await this.llm.invoke(messages, ...args);
    }

    // 保存到历史记录
    this.add_message(new Message(inputText, "user"));
    this.add_message(new Message(finalResponse, "assistant"));
    console.log(`✅ ${this.name} 响应完成`);

    return finalResponse;
  }

  private _parseToolCalls(
    text: string,
  ): Array<{ toolName: string; parameters: string; original: string }> {
    /**解析文本中的工具调用*/
    const pattern = /\[TOOL_CALL:([^:]+):([^\]]+)\]/g;
    const matches = text.matchAll(pattern);

    const toolCalls: Array<{
      toolName: string;
      parameters: string;
      original: string;
    }> = [];
    for (const match of matches) {
      const [original, toolName, parameters] = match;
      console.log(
        `解析到工具调用: toolName=${toolName.trim()}, parameters=${parameters.trim()}`,
      );
      toolCalls.push({
        toolName: toolName.trim(),
        parameters: parameters.trim(),
        original,
      });
    }

    return toolCalls;
  }

  private async _executeToolCall(
    toolName: string,
    parameters: string,
  ): Promise<string> {
    /**执行工具调用*/
    if (!this.toolRegistry) {
      return "❌ 错误：未配置工具注册表";
    }

    try {
      // 智能参数解析
      if (toolName.toLowerCase() === "calculator") {
        // 计算器工具直接传入表达式
        // 尝试使用不同的大小写形式
        let result;
        try {
          // 尝试使用原始工具名称
          result = this.toolRegistry.executeTool(toolName, {
            input: parameters,
          });
        } catch (error) {
          try {
            // 尝试使用首字母大写的工具名称
            const capitalizedToolName =
              toolName.charAt(0).toUpperCase() + toolName.slice(1);
            result = this.toolRegistry.executeTool(capitalizedToolName, {
              input: parameters,
            });
          } catch (error) {
            // 尝试使用全大写的工具名称
            const upperCaseToolName = toolName.toUpperCase();
            result = this.toolRegistry.executeTool(upperCaseToolName, {
              input: parameters,
            });
          }
        }
        return `🔧 工具 ${toolName} 执行结果：\n${result}`;
      } else {
        // 其他工具使用智能参数解析
        const paramDict = this._parseToolParameters(toolName, parameters);
        let tool = this.toolRegistry.getTool(toolName);

        // 尝试使用不同的大小写形式
        if (!tool) {
          // 尝试使用首字母大写的工具名称
          const capitalizedToolName =
            toolName.charAt(0).toUpperCase() + toolName.slice(1);
          tool = this.toolRegistry.getTool(capitalizedToolName);
        }

        if (!tool) {
          // 尝试使用全大写的工具名称
          const upperCaseToolName = toolName.toUpperCase();
          tool = this.toolRegistry.getTool(upperCaseToolName);
        }

        if (!tool) {
          return `❌ 错误：未找到工具 '${toolName}'`;
        }

        const result = tool.execute(paramDict);
        return `🔧 工具 ${toolName} 执行结果：\n${result}`;
      }
    } catch (error) {
      return `❌ 工具调用失败：${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private _parseToolParameters(
    toolName: string,
    parameters: string,
  ): Record<string, string> {
    /**智能解析工具参数*/
    const paramDict: Record<string, string> = {};

    if (parameters.includes("=")) {
      // 格式: key=value 或 action=search,query=Python
      if (parameters.includes(",")) {
        // 多个参数：action=search,query=Python,limit=3
        const pairs = parameters.split(",");
        for (const pair of pairs) {
          if (pair.includes("=")) {
            const [key, value] = pair.split("=", 1);
            paramDict[key.trim()] = value.trim();
          }
        }
      } else {
        // 单个参数：key=value
        const [key, value] = parameters.split("=", 1);
        paramDict[key.trim()] = value.trim();
      }
    } else {
      // 直接传入参数，根据工具类型智能推断
      if (toolName === "search") {
        paramDict["query"] = parameters;
      } else if (toolName === "memory") {
        paramDict["action"] = "search";
        paramDict["query"] = parameters;
      } else {
        paramDict["input"] = parameters;
      }
    }

    return paramDict;
  }

  async *streamRun(inputText: string, ...args: any[]): AsyncGenerator<string> {
    /**
     * 自定义的流式运行方法
     */
    console.log(`🌊 ${this.name} 开始流式处理: ${inputText}`);

    const messages: any[] = [];

    if (this.system_prompt) {
      messages.push({ role: "system", content: this.system_prompt });
    }

    for (const msg of this.get_history()) {
      // 验证并转换角色值
      let validRole = msg.role;
      const validRoles = ["system", "user", "assistant", "tool"];
      if (!validRoles.includes(msg.role.toLowerCase())) {
        // 默认为 user 角色
        validRole = "user";
      }
      messages.push({ role: validRole, content: msg.content });
    }

    messages.push({ role: "user", content: inputText });

    // 流式调用LLM
    let fullResponse = "";
    process.stdout.write("📝 实时响应: ");
    for await (const chunk of this.llm.streamInvoke(messages, ...args)) {
      fullResponse += chunk;
      process.stdout.write(chunk);
      yield chunk;
    }

    console.log(); // 换行

    // 保存完整对话到历史记录
    this.add_message(new Message(inputText, "user"));
    this.add_message(new Message(fullResponse, "assistant"));
    console.log(`✅ ${this.name} 流式响应完成`);
  }

  addTool(tool: any): void {
    /**添加工具到Agent（便利方法）*/
    if (!this.toolRegistry) {
      this.toolRegistry = new ToolRegistry();
      this.enableToolCalling = true;
    }

    this.toolRegistry.registerTool(tool);
    console.log(`🔧 工具 '${tool.name}' 已添加`);
  }

  hasTools(): boolean {
    /**检查是否有可用工具*/
    return this.enableToolCalling && this.toolRegistry !== null;
  }

  removeTool(toolName: string): boolean {
    /**移除工具（便利方法）*/
    if (this.toolRegistry) {
      this.toolRegistry.unregister(toolName);
      return true;
    }
    return false;
  }

  listTools(): string[] {
    /**列出所有可用工具*/
    if (this.toolRegistry) {
      return this.toolRegistry.listTools();
    }
    return [];
  }
}
