import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import dotenv from "dotenv";

dotenv.config();

// 创建模型实例，默认使用text-embedding-v1模型
const model = new AlibabaTongyiEmbeddings({
  modelName: "text-embedding-v1",
  apiKey: process.env.API_KEY,
});

// 使用embedQuery方法生成嵌入向量
async function run() {
  try {
    const embedding = await model.embedQuery("我喜欢你");
    // 打印嵌入向量的前5个元素
    console.log(embedding.slice(0, 5));
    const embeddings = await model.embedDocuments(["我不喜欢你", "你不喜欢我"]);
    console.log(embeddings[0].slice(0, 5));
    console.log(embeddings[1].slice(0, 5));
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
