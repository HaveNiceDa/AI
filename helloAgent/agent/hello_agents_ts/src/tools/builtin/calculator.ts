/**
 * 计算器工具
 */
import { BaseTool } from '../base.js';

export class CalculatorTool extends BaseTool {
  constructor() {
    super(
      'Calculator',
      '一个简单的计算器工具，用于执行数学计算。输入应为有效的数学表达式。'
    );
  }

  execute(args: any): string {
    const expression = args.expression || args.input || '';
    if (!expression) {
      return '错误：请提供数学表达式。';
    }

    try {
      // 使用 eval 执行计算（注意：在生产环境中应使用更安全的计算方法）
      const result = eval(expression);
      return `计算结果：${expression} = ${result}`;
    } catch (error) {
      return `错误：${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
