import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatAlibabaTongyi({
  model: "qwen-max",
  alibabaApiKey: process.env.API_KEY,
});

const strParser = new StringOutputParser();

const firstPrompt = PromptTemplate.fromTemplate(
  "我邻居姓：{lastname}，刚生了{gender}，请帮忙起名字，仅告知我名字，不要额外信息。"
);

const secondPrompt = PromptTemplate.fromTemplate(
  "姓名{name}，请帮我解析含义。"
);

// 函数的入参: AIMessage -> dict ({"name": "xxx"})
const myFunc = new RunnableLambda({
  func: (aiMsg: any) => ({ name: aiMsg.content })
});

const chain = firstPrompt
  .pipe(model)
  .pipe(myFunc)
  .pipe(secondPrompt)
  .pipe(model)
  .pipe(strParser);

async function run() {
  try {
    const stream = await chain.stream({ lastname: "张", gender: "女孩" });
    for await (const chunk of stream) {
      process.stdout.write(chunk as string);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();