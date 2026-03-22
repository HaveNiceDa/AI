import dotenv from "dotenv";
import { ToolExecutor } from "./toolManager.ts";
import { search } from "./tools/search.ts";

// 加载环境变量
dotenv.config({
  path: "../../../.env",
});

// --- 工具初始化与使用示例 ---
async function main() {
  // 1. 初始化工具执行器
  const toolExecutor = new ToolExecutor();

  // 2. 注册我们的实战搜索工具
  const searchDescription =
    "一个网页搜索引擎。当你需要回答关于时事、事实以及在你的知识库中找不到的信息时，应使用此工具。";
  toolExecutor.registerTool("Search", searchDescription, search);

  // 3. 打印可用的工具
  console.log("\n--- 可用的工具 ---");
  console.log(toolExecutor.getAvailableTools());

  // 4. 智能体的Action调用，这次我们问一个实时性的问题
  console.log("\n--- 执行 Action: Search['英伟达最新的GPU型号是什么'] ---");
  const toolName = "Search";
  const toolInput = "英伟达最新的GPU型号是什么";

  const toolFunction = toolExecutor.getTool(toolName);
  if (toolFunction) {
    const observation = await toolFunction(toolInput);
    console.log("--- 观察 (Observation) ---");
    console.log(observation);
  } else {
    console.log(`错误:未找到名为 '${toolName}' 的工具。`);
  }
}

// 运行主函数
main().catch(console.error);
