interface WeatherDesc {
  value: string;
}

interface CurrentCondition {
  weatherDesc: WeatherDesc[];
  temp_C: string;
}

interface WeatherData {
  current_condition: CurrentCondition[];
}

/** 查询真实天气工具 */
export async function getWeather(city: string): Promise<string> {
  const url = `https://wttr.in/${city}?format=j1`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const raw = await response.json();
    const data: WeatherData = raw as WeatherData;

    const currentCondition = data.current_condition[0];
    const weatherDesc = currentCondition.weatherDesc[0].value;
    const tempC = currentCondition.temp_C;

    return `${city}当前天气:${weatherDesc}，气温${tempC}摄氏度`;
  } catch (error) {
    if (error instanceof TypeError) {
      return `错误:查询天气时遇到网络问题 - ${error.message}`;
    }
    return `错误:解析天气数据失败，可能是城市名称无效 - ${error}`;
  }
}
