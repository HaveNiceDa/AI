import { StringOutputParser, JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi';
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';

dotenv.config();
// 创建所需的解析器
const str_parser = new StringOutputParser();
const json_parser = new JsonOutputParser();

// 模型创建
const model = new ChatAlibabaTongyi({ model: "qwen-max", alibabaApiKey: process.env.API_KEY });

// 第一个提示词模板
const first_prompt = PromptTemplate.fromTemplate(
  "我邻居姓：{lastname}，刚生了{gender}，请帮忙起名字，并封装为 JSON 格式返回给我。要求 key 是 name，value 就是你起的名字，请严格遵守格式要求。"
);

// 第二个提示词模板
const second_prompt = PromptTemplate.fromTemplate(
  "姓名：{name}，请帮我解析含义。"
);

// 创建链式结构
const chain = first_prompt.pipe(model).pipe(json_parser).pipe(second_prompt).pipe(model).pipe(str_parser);

// 调用链式结构
async function run() {
  const res = await chain.invoke({ lastname: '张', gender: '女儿' });
  console.log(res);
  console.log(typeof res);
}

// 执行函数
run();