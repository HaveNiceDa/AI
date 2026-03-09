interface TavilyResult {
  title: string;
  content: string;
}

interface TavilyResponse {
  answer?: string;
  results?: TavilyResult[];
}

/** 根据城市和天气状况，互联网上搜索合适的景点： */
export async function getAttraction(
  city: string,
  weather: string,
): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return "错误:未配置TAVILY_API_KEY环境变量。";
  }

  const query = `'${city}' 在'${weather}'天气下最值得去的旅游景点推荐及理由`;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TavilyResponse = (await response.json()) as TavilyResponse;

    if (data.answer) {
      return data.answer;
    }

    const formattedResults: string[] = [];
    for (const result of data.results || []) {
      formattedResults.push(`- ${result.title}: ${result.content}`);
    }

    if (formattedResults.length === 0) {
      return "抱歉，没有找到相关的旅游景点推荐。";
    }

    return "根据搜索，为您找到以下信息:\n" + formattedResults.join("\n");
  } catch (error) {
    return `错误:执行Tavily搜索时出现问题 - ${error}`;
  }
}
