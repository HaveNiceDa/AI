import { HelloAgentsLLM, createAgent, ToolRegistry } from './src';
import { CalculatorTool } from './src/tools/builtin/calculator.js';

async function testAgent() {
  try {
    // 初始化 LLM 客户端
    const llm = new HelloAgentsLLM(
      'openai',
      process.env.MODEL_NAME || 'gpt-3.5-turbo'
    );

    // 创建工具注册表
    const toolRegistry = new ToolRegistry();
    toolRegistry.registerTool(new CalculatorTool());

    // 创建 Simple 代理
    const simpleAgent = createAgent('simple', 'simple_agent', llm);
    console.log('Simple Agent 已创建:', simpleAgent.toString());

    // 创建 ReAct 代理
    const reactAgent = createAgent('react', 'react_agent', llm, undefined, toolRegistry);
    console.log('ReAct Agent 已创建:', reactAgent.toString());

    // 创建 Plan & Solve 代理
    const planSolveAgent = createAgent('plan_solve', 'plan_solve_agent', llm);
    console.log('Plan & Solve Agent 已创建:', planSolveAgent.toString());

    // 创建 Reflection 代理
    const reflectionAgent = createAgent('reflection', 'reflection_agent', llm);
    console.log('Reflection Agent 已创建:', reflectionAgent.toString());

    console.log('\n✅ 所有代理创建成功！');
  } catch (error) {
    console.error('测试错误:', error);
  }
}

testAgent();
