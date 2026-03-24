/**
 * 工具基类
 */
export interface Tool {
  name: string;
  description: string;
  execute(args: any): string | Promise<string>;
}

export class BaseTool implements Tool {
  name: string;
  description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  execute(args: any): string | Promise<string> {
    throw new Error('子类必须实现 execute 方法');
  }
}
