import { HelloAgentsLLM } from "./core/llm.js";
import { createAgent } from "./agents/factory.js";

// 导出核心模块
export * from "./core/agent.js";
export * from "./core/llm.js";
export * from "./core/config.js";
export * from "./core/message.js";
export * from "./core/lifecycle.js";

// 导出代理模块
export * from "./agents/simple_agent.js";
export * from "./agents/react_agent.js";
export * from "./agents/plan_solve_agent.js";
export * from "./agents/reflection_agent.js";
export * from "./agents/factory.js";

// 示例用法
async function main() {
  try {
    // 初始化 LLM 客户端
    const llm = new HelloAgentsLLM(
      "openai",
      process.env.MODEL_NAME || "gpt-3.5-turbo",
    );

    // 创建 Simple 代理
    const simpleAgent = createAgent("simple", "simple_agent", llm);
    console.log("Simple Agent 已创建:", simpleAgent.toString());

    // 创建 ReAct 代理
    const reactAgent = createAgent("react", "react_agent", llm);
    console.log("ReAct Agent 已创建:", reactAgent.toString());

    // 创建 Plan & Solve 代理
    const planSolveAgent = createAgent("plan_solve", "plan_solve_agent", llm);
    console.log("Plan & Solve Agent 已创建:", planSolveAgent.toString());

    // 创建 Reflection 代理
    const reflectionAgent = createAgent("reflection", "reflection_agent", llm);
    console.log("Reflection Agent 已创建:", reflectionAgent.toString());

    console.log("\nHello Agents TypeScript 版本初始化完成！");

    // 示例：使用 Simple 代理回答问题
    console.log("\n=== 测试 Simple 代理 ===");
    const simpleResult = await simpleAgent.run(
      "你好，告诉我一个关于人工智能的有趣事实",
    );
    console.log("Simple 代理回答:", simpleResult);

    // 示例：使用 ReAct 代理解决问题
    console.log("\n=== 测试 ReAct 代理 ===");
    const reactResult = await reactAgent.run(
      "如果我有100元，买了一个30元的商品，还剩多少钱？",
    );
    console.log("ReAct 代理回答:", reactResult);
  } catch (error) {
    console.error("初始化错误:", error);
  }
}

// 直接运行 main 函数
main();
