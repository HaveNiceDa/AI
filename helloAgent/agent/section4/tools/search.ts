import { getJson } from "serpapi";
import * as fs from "fs";
import * as path from "path";

export async function search(query: string): Promise<string> {
  /**
   * 一个基于SerpApi的实战网页搜索引擎工具。
   * 它会智能地解析搜索结果，优先返回直接答案或知识图谱信息。
   */
  console.log(`🔍 正在执行 [SerpApi] 网页搜索: ${query}`);

  try {
    // 直接读取 .env 文件
    let apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
      return "错误:SERPAPI_API_KEY 未在 .env 文件中配置。";
    }

    const results = await getJson({
      engine: "google",
      q: query,
      api_key: apiKey,
      gl: "cn", // 国家代码
      hl: "zh-cn", // 语言代码
    });

    // 智能解析:优先寻找最直接的答案
    if (results.answer_box_list) {
      return results.answer_box_list.join("\n");
    }
    if (results.answer_box && results.answer_box.answer) {
      return results.answer_box.answer;
    }
    if (results.knowledge_graph && results.knowledge_graph.description) {
      return results.knowledge_graph.description;
    }
    if (results.organic_results && results.organic_results.length > 0) {
      // 如果没有直接答案，则返回前三个有机结果的摘要
      const snippets = results.organic_results
        .slice(0, 3)
        .map((res: any, i: number) => {
          return `[${i + 1}] ${res.title || ""}\n${res.snippet || ""}`;
        });
      return snippets.join("\n\n");
    }

    return `对不起，没有找到关于 '${query}' 的信息。`;
  } catch (error) {
    return `搜索时发生错误: ${error}`;
  }
}
