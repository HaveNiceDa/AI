import { PromptTemplate, FewShotPromptTemplate } from "@langchain/core/prompts";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import dotenv from "dotenv";

dotenv.config();

// 示例的模板
const exampleTemplate = PromptTemplate.fromTemplate("单词：{word}，反义词：{antonym}");

// 示例的动态数据注入 要求是list内部套字典
const examplesData = [
  { word: "大", antonym: "小" },
  { word: "上", antonym: "下" }
];

const fewShotTemplate = new FewShotPromptTemplate({
  examplePrompt: exampleTemplate, // 示例数据的模板
  examples: examplesData, // 示例的数据（用来注入动态数据的），list内部套字典
  prefix: "告知我单词的反义词，我提供如下的示例：", // 示例之前的提示词
  suffix: "基于前面的示例告知我，{input_word}的反义词是？", // 示例之后的提示词
  inputVariables: ["input_word"] // 声明在前缀或后缀中所需要注入的变量名
});

// 生成提示词
async function generatePrompt() {
  const promptText = await fewShotTemplate.invoke({ input_word: "左" });
  console.log(promptText);
  
  // 初始化模型
  const model = new ChatAlibabaTongyi({
    model: "qwen-max",
    alibabaApiKey: process.env.API_KEY,
  });
  
  // 调用模型
  const response = await model.invoke(promptText);
  console.log(response.content);
}

// 执行函数
generatePrompt();