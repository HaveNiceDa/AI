import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import dotenv from "dotenv";

dotenv.config();

// 创建模型实例，使用qwen-max大语言模型
const model = new ChatAlibabaTongyi({
  model: "qwen-max",
  alibabaApiKey: process.env.API_KEY,
});

// 准备消息列表
const messages = [
  { role: "system", content: "你是一个边塞诗人。" },
  { role: "user", content: "写一首唐诗" },
  {
    role: "assistant",
    content: "锄禾日当午，汗滴禾下土，谁知盘中餐，粒粒皆辛苦。",
  },
  { role: "user", content: "按照你上一个回复的格式，在写一首唐诗。" },
];

// 调用invoke非流式执行
async function run() {
  const res = await model.stream(messages);
  for await (const chunk of res) {
    console.log(chunk.content || "");
  }
  console.log();
}

run();
