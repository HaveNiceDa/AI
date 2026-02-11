import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config();

// 创建聊天提示模板
const chatPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "你是一个边塞诗人，可以作诗。"],
  new MessagesPlaceholder("history"),
  ["human", "请再来一首唐诗"],
]);

// 定义历史消息数据
const historyData = [
  new HumanMessage("你来写一个唐诗"),
  new AIMessage("床前明月光，疑是地上霜，举头望明月，低头思故乡"),
  new HumanMessage("好诗再来一个"),
  new AIMessage("锄禾日当午，汗滴禾下土，谁知盘中餐，粒粒皆辛苦"),
];

// 初始化模型
const model = new ChatAlibabaTongyi({
  model: "qwen-max",
  alibabaApiKey: process.env.API_KEY,
});

// 组成链，要求每一个组件都是Runnable接口的子类
const chain = chatPromptTemplate.pipe(model);

// 通过链去调用invoke或stream
async function run() {
  const res = await chain.invoke({ history: historyData });
  console.log(res.content);
}

// 执行函数
run();