import { InitPlugins, Setting } from "utools-helper";
import { config } from "./config";
import { FyWeather } from "./fyweather";

InitPlugins([new FyWeather(), Setting.Init("fyweather-setting", config)]);
