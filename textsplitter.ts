import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// 创建文本分割器实例
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100,      // 每个文本块的最大字符数
  chunkOverlap: 20,    // 文本块之间的重叠字符数
  separators: ["\n\n", "\n", " ", ""]  // 分隔符优先级，从高到低
});

// 示例文本
const text = `
LangChain是一个用于开发由语言模型驱动的应用程序的框架。
它提供了一套工具、组件和接口，帮助开发者轻松构建复杂的应用程序。
LangChain支持多种语言模型，包括OpenAI、Anthropic等。
它还提供了文档加载、文本分割、向量存储等功能。
文本分割是处理长文本的重要步骤，可以将大文档分割成小块。
这样可以更好地处理、嵌入和存储文本内容。
`;

// 分割文本
async function splitText() {
  const chunks = await textSplitter.splitText(text);
  
  console.log(`总共分割成 ${chunks.length} 个文本块：\n`);
  
  chunks.forEach((chunk, index) => {
    console.log(`--- 文本块 ${index + 1} ---`);
    console.log(chunk);
    console.log(`长度: ${chunk.length} 字符\n`);
  });
}

// 执行文本分割
splitText();