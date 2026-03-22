type ToolFunction = (...args: any[]) => Promise<string>;

interface ToolInfo {
  description: string;
  func: ToolFunction;
}

export class ToolExecutor {
  private tools: Record<string, ToolInfo> = {};

  /**
   * 向工具箱中注册一个新工具。
   */
  registerTool(name: string, description: string, func: ToolFunction): void {
    if (name in this.tools) {
      console.log(`警告:工具 '${name}' 已存在，将被覆盖。`);
    }
    this.tools[name] = { description, func };
    console.log(`工具 '${name}' 已注册。`);
  }

  /**
   * 根据名称获取一个工具的执行函数。
   */
  getTool(name: string): ToolFunction | undefined {
    return this.tools[name]?.func;
  }

  /**
   * 获取所有可用工具的格式化描述字符串。
   */
  getAvailableTools(): string {
    return Object.entries(this.tools)
      .map(([name, info]) => `- ${name}: ${info.description}`)
      .join('\n');
  }
}
