/**
 * 工具注册表
 */
import { Tool } from './base.js';

export class ToolRegistry {
  private tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`工具 '${tool.name}' 已注册。`);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  executeTool(name: string, args: any): string | Promise<string> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`工具 '${name}' 未注册。`);
    }
    return tool.execute(args);
  }

  clear(): void {
    this.tools.clear();
    console.log('所有工具已清除。');
  }
}
