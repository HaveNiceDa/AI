import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatAlibabaTongyi({
  model: "qwen-max",
  alibabaApiKey: process.env.API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你需要根据会话历史回应用户问题。"],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

const strParser = new StringOutputParser();

const baseChain = prompt.pipe(model).pipe(strParser);

const store: Record<string, InMemoryChatMessageHistory> = {};

function getHistory(sessionId: string): InMemoryChatMessageHistory {
  console.log("sessionId", sessionId)
  if (!(sessionId in store)) {
    store[sessionId] = new InMemoryChatMessageHistory();
  }
  return store[sessionId];
}

// 实现通过
// 创建一个新的链，对原有链增强功能：自动附加历史消息
const conversationChain = new RunnableWithMessageHistory({
  runnable: baseChain,      // 被增强的原有chain
  getMessageHistory: getHistory,  // 通过会话id获取InMemoryChatMessageHistory类对象
  inputMessagesKey: "input",      // 表示用户输入在模板中的占位符
  historyMessagesKey: "chat_history" // 表示用户输入在模板中的占位符
});

async function run() {
  // 固定格式，添加LangChain的配置，为当前程序配置所属的session_id
  const sessionConfig = {
    configurable: {
      sessionId: "user_001"
    }
  };

  const res1 = await conversationChain.invoke({ input: "小明有2个猫" }, sessionConfig);
  console.log("第1次执行", res1);

  const res2 = await conversationChain.invoke({ input: "小刚有1只狗" }, sessionConfig);
  console.log("第2次执行", res2);

  const res3 = await conversationChain.invoke({ input: "总共有几个宠物" }, sessionConfig);
  console.log("第3次执行", res3);
}

run();

