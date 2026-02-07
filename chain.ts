import { PromptTemplate } from "@langchain/core/prompts";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import dotenv from "dotenv";

dotenv.config();

// 创建提示模板
const promptTemplate = PromptTemplate.fromTemplate(
  "我的邻居姓{lastname}，刚生了{gender}，你帮我起个名，简单回答。",
);

// 创建模型实例
const model = new ChatAlibabaTongyi({
  model: "qwen-max",
  alibabaApiKey: process.env.API_KEY,
});

// 创建链式调用
const chain = promptTemplate.pipe(model);

// 调用chain
async function run() {
  try {
    const res = await chain.invoke({ lastname: "张", gender: "女儿" });
    console.log(res.content);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
