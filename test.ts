import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import dotenv from "dotenv";

dotenv.config();

// 不用qwen3-max，因为qwen3-max是聊天模型，qwen-max是大语言模型
const model = new ChatAlibabaTongyi({
  model: "qwen-max",
  alibabaApiKey: process.env.API_KEY,
});

// 调用invoke向模型提问
async function run() {
  const res = await model.stream("你是谁呀能做什么？");
  for await (const chunk of res) {
    console.log(chunk.content, "");
  }
}

run();
