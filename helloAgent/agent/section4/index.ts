import { HelloAgentsLLM } from "./llm.ts";
import { ToolExecutor } from "./toolManager.ts";
import { search } from "./tools/search.ts";
import { ReActAgent } from "./ReActAgent.ts";

// --- 主程序入口 ---
async function main() {
  try {
    // 初始化 LLM 客户端
    const llm = new HelloAgentsLLM();
    
    // 初始化工具执行器
    const toolExecutor = new ToolExecutor();
    
    // 注册搜索工具
    const searchDesc = "一个网页搜索引擎。当你需要回答关于时事、事实以及在你的知识库中找不到的信息时，应使用此工具。";
    toolExecutor.registerTool("Search", searchDesc, search);
    
    // 初始化 ReAct 智能体
    const agent = new ReActAgent(llm, toolExecutor);
    
    // 定义问题
    const question = "华为最新的手机是哪一款？它的主要卖点是什么？";
    
    // 运行智能体
    console.log(`\n--- 开始运行 ReAct 智能体 ---\n`);
    console.log(`问题: ${question}\n`);
    
    const result = await agent.run(question);
    
    if (result) {
      console.log(`\n--- 运行完成 ---\n`);
      console.log(`最终答案: ${result}`);
    } else {
      console.log(`\n--- 运行失败 ---\n`);
      console.log("智能体未能回答问题。");
    }
  } catch (error) {
    console.error("运行时发生错误:", error);
  }
}

// 运行主函数
main();
