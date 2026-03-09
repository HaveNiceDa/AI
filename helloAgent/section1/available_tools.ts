import { getWeather } from "./get_weather.ts";
import { getAttraction } from "./search_attraction.ts";

// 工具函数映射
const availableTools: Record<
  string,
  (city: string, weather?: string) => Promise<string>
> = {
  get_weather: getWeather,
  get_attraction: (city: string, weather?: string) =>
    getAttraction(city, weather!),
};

export { availableTools };
