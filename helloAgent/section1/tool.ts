import { getWeather } from "./get_weather";
import { getAttraction } from "./search_attraction";

// 将所有工具函数放入一个字典，方便后续调用
const availableTools: Record<
  string,
  (city: string, weather?: string) => Promise<string>
> = {
  get_weather: getWeather,
  get_attraction: (city: string, weather?: string) => getAttraction(city, weather!),
};

export { availableTools, getWeather, getAttraction };
