import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseWeatherHistory,
  type WeatherEntry,
} from "../lib/weatherCore.ts";

export const WEATHER_HISTORY_KEY = "litmo.weather.history.v1";

export const weatherStore = {
  async load(): Promise<WeatherEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(WEATHER_HISTORY_KEY);
      if (!raw) return [];
      return parseWeatherHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(entry: WeatherEntry): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        WEATHER_HISTORY_KEY,
        JSON.stringify([entry, ...prev].slice(0, 100)),
      );
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromWeather } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromWeather(entry));
  },
};
