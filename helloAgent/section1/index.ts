import { OpenAICompatibleClient } from "./llm";
import { availableTools } from "./tool";

// --- 1. 配置LLM客户端 ---
// 请根据您使用的服务，将这里替换成对应的凭证和地址
const API_KEY = process.env.OPENAI_API_KEY || "YOUR_API_KEY";
const BASE_URL = process.env.OPENAI_BASE_URL || "YOUR_BASE_URL";
const MODEL_ID = process.env.MODEL_NAME || "YOUR_MODEL_ID";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "YOUR_TAVILY_KEY";
process.env.TAVILY_API_KEY = TAVILY_API_KEY;

const llm = new OpenAICompatibleClient(MODEL_ID, API_KEY, BASE_URL);

// 系统提示
const AGENT_SYSTEM_PROMPT = `
你是一个旅游助手，需要根据用户的请求，通过调用工具来获取信息并提供建议。

可用工具:
1. get_weather(city: string): 获取指定城市的天气信息
2. get_attraction(city: string, weather: string): 根据城市和天气推荐旅游景点

请按照以下格式输出你的思考和行动:
Thought: 你的思考过程
Action: 工具调用，格式为 工具名(参数名="参数值", ...)

当你获得足够的信息并准备提供最终答案时，请使用以下格式:
Action: Finish[最终答案]
`;

// --- 2. 初始化 ---
const userPrompt =
  "你好，请帮我查询一下今天北京的天气，然后根据天气推荐一个合适的旅游景点。";
const promptHistory: string[] = [`用户请求: ${userPrompt}`];

console.log(`用户输入: ${userPrompt}\n` + "=".repeat(40));

// --- 3. 运行主循环 ---
async function runAgent() {
  for (let i = 0; i < 5; i++) {
    // 设置最大循环次数
    console.log(`--- 循环 ${i + 1} ---\n`);

    // 3.1. 构建Prompt
    const fullPrompt = promptHistory.join("\n");

    // 3.2. 调用LLM进行思考
    const llmOutput = await llm.generate(fullPrompt, AGENT_SYSTEM_PROMPT);
    // 模型可能会输出多余的Thought-Action，需要截断
    const match = llmOutput.match(
      /(Thought:.*?Action:.*?)(?=\n\s*(?:Thought:|Action:|Observation:)|)/s,
    );
    let processedOutput = llmOutput;
    if (match && match[1].trim() !== llmOutput.trim()) {
      processedOutput = match[1].trim();
      console.log("已截断多余的 Thought-Action 对");
    }
    console.log(`模型输出:\n${processedOutput}\n`);
    promptHistory.push(processedOutput);

    // 3.3. 解析并执行行动
    const actionMatch = processedOutput.match(/Action: (.*)/s);
    if (!actionMatch) {
      const observation =
        "错误: 未能解析到 Action 字段。请确保你的回复严格遵循 'Thought: ... Action: ...' 的格式。";
      const observationStr = `Observation: ${observation}`;
      console.log(`${observationStr}\n` + "=".repeat(40));
      promptHistory.push(observationStr);
      continue;
    }
    const actionStr = actionMatch[1].trim();

    if (actionStr.startsWith("Finish")) {
      const finalAnswerMatch = actionStr.match(/Finish\[(.*)\]/);
      if (finalAnswerMatch) {
        const finalAnswer = finalAnswerMatch[1];
        console.log(`任务完成，最终答案: ${finalAnswer}`);
      }
      break;
    }

    const toolNameMatch = actionStr.match(/(\w+)\(/);
    const argsMatch = actionStr.match(/\((.*)\)/);

    if (!toolNameMatch || !argsMatch) {
      const observation =
        '错误: 工具调用格式不正确，请使用 工具名(参数名="参数值", ...) 的格式。';
      const observationStr = `Observation: ${observation}`;
      console.log(`${observationStr}\n` + "=".repeat(40));
      promptHistory.push(observationStr);
      continue;
    }

    const toolName = toolNameMatch[1];
    const argsStr = argsMatch[1];

    // 解析参数
    const kwargs: Record<string, string> = {};
    const argMatches = argsStr.match(/(\w+)="([^"]*)"/g);
    if (argMatches) {
      argMatches.forEach((arg) => {
        const [, key, value] = arg.match(/(\w+)="([^"]*)"/) || [];
        if (key && value) {
          kwargs[key] = value;
        }
      });
    }

    if (toolName in availableTools) {
      let observation: string;
      try {
        // 调用工具，处理不同参数数量
        if (toolName === "get_weather") {
          observation = await availableTools[toolName](kwargs.city);
        } else if (toolName === "get_attraction") {
          observation = await availableTools[toolName](
            kwargs.city,
            kwargs.weather,
          );
        } else {
          observation = "错误: 工具参数处理失败";
        }
      } catch (error) {
        observation = `错误: 调用工具时出错 - ${error}`;
      }
      // 3.4. 记录观察结果
      const observationStr = `Observation: ${observation}`;
      console.log(`${observationStr}\n` + "=".repeat(40));
      promptHistory.push(observationStr);
    } else {
      const observation = `错误:未定义的工具 '${toolName}'`;
      const observationStr = `Observation: ${observation}`;
      console.log(`${observationStr}\n` + "=".repeat(40));
      promptHistory.push(observationStr);
    }
  }
}

// 运行代理
runAgent().catch(console.error);
