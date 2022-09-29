"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyWeather = void 0;
const utools_helper_1 = require("utools-helper");
const axios_1 = require("axios");
class FyWeather {
    constructor() {
        this.code = "fyweather";
        this.request = null;
        // 彩云天气开放平台令牌
        this.token = "";
        // 纬度
        this.latitude = "";
        // 经度
        this.longitude = "";
        // 用作缓存数据
        this.weatherData = null;
    }
    /** 获取位置信息 */
    async getLocation() {
        var _a;
        const timestamp = new Date().getTime();
        const url = "https://map.baidu.com/?qt=ipLocation&t=" + timestamp;
        let request = this.request;
        if (!request) {
            request = axios_1.default.create({
                timeout: 10000,
                withCredentials: true,
            });
            this.request = request;
        }
        let locationResult = await request.get(url);
        console.log(locationResult);
        if (!((_a = locationResult === null || locationResult === void 0 ? void 0 : locationResult.data) === null || _a === void 0 ? void 0 : _a.rgc)) {
            const cookies = locationResult.headers["set-cookie"];
            let cookieStr = "", csrfStr = "";
            cookies.forEach((cookie) => {
                cookieStr += cookie.split(";")[0] + ";";
                if (cookie.includes("ctoken")) {
                    csrfStr = cookie.match(/ctoken=(.*?);/)[1];
                }
            });
            request.interceptors.request.use((config) => {
                // 设置header
                if (config.headers) {
                    if (cookieStr) {
                        config.headers['cookie'] = cookieStr;
                    }
                    if (csrfStr) {
                        config.headers['X-CSRF-TOKEN'] = csrfStr;
                    }
                }
                return config;
            }, (error) => {
                return Promise.reject(error);
            });
            this.request = request;
            locationResult = await request.get(url);
        }
        const location = locationResult.data.rgc.result.location;
        this.latitude = (location === null || location === void 0 ? void 0 : location.lat) || "";
        this.longitude = (location === null || location === void 0 ? void 0 : location.lng) || "";
        utools_helper_1.Setting.Set("latitude", this.latitude);
        utools_helper_1.Setting.Set("longitude", this.longitude);
        return location;
    }
    /** 获取天气信息 */
    async getWeather() {
        if (!this.longitude || !this.latitude) {
            await this.getLocation();
        }
        const url = `https://api.caiyunapp.com/v2.6/${this.token}/${this.longitude},${this.latitude}/weather?alert=true&dailysteps=1&hourlysteps=24`;
        // console.log(url);
        const weatherRes = await axios_1.default.get(url);
        if (weatherRes && weatherRes.data && weatherRes.data.status == "ok") {
            return weatherRes.data.result;
        }
        return null;
    }
    /** 进入插件时调用 */
    async enter() {
        this.token = utools_helper_1.Setting.Get("token");
        this.latitude = utools_helper_1.Setting.Get("latitude");
        this.longitude = utools_helper_1.Setting.Get("longitude");
        return this.search("");
    }
    /** 输入关键字时调用 */
    async search(keyword) {
        if (this.token) {
            return Promise.resolve([{
                    title: "当前位置天气",
                    description: "显示当前位置天气",
                    data: null,
                    operate: "current"
                }]);
        }
        else {
            utools.showNotification("请先进行设置");
            return Promise.resolve([{
                    title: "请先进行设置",
                    description: '搜索"天气设置"进行设置',
                    data: null,
                }]);
        }
    }
    /** 选择一个选项时调用 */
    async select(item) {
        var _a, _b;
        // const weatherResult = await this.getWeather();
        const weatherData = await this.getWeather();
        if (!weatherData) {
            utools.showNotification("获取天气失败");
            return Promise.resolve([{
                    title: "获取天气失败",
                    description: "请重新加载插件",
                    data: null,
                }]);
        }
        this.weatherData = weatherData;
        const list = [];
        if ((_b = (_a = weatherData.alert) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.length) {
            list.push(weatherData.alert.content.map((o) => ({
                title: (o.status || "") + o.title + " " + o.description,
                description: "来源：" + o.source,
            })));
        }
        const realtime = weatherData.realtime;
        list.push(...[
            {
                title: `温度：${realtime.temperature}，相对湿度：${realtime.humidity}，地面气压：${realtime.pressure}，水平能见度：${realtime.visibility}，总云量：${realtime.cloudrate}，天气：${realtime.skycon}`,
                description: (weatherData === null || weatherData === void 0 ? void 0 : weatherData.forecast_keypoint) || "",
                data: weatherData,
            },
            {
                title: `地表风速：${realtime.wind.speed}，地表风向：${realtime.wind.direction}`,
                description: "",
                data: weatherData,
            },
            {
                title: `降水预测：本地降水强度：${realtime.precipitation.local.intensity}，最近降水带与本地的距离：${realtime.precipitation.nearest.distance}，最近降水处的降水强度：${realtime.precipitation.nearest.intensity}`,
                description: "",
                data: weatherData,
            },
            {
                title: `空气质量：PM25 浓度(μg/m3)：${realtime.air_quality.pm25}，PM10 浓度(μg/m3)：${realtime.air_quality.pm10}`,
                description: "",
                data: weatherData,
            },
            {
                title: `生活指数：舒适度：${realtime.life_index.comfort.desc}，紫外线：${realtime.life_index.ultraviolet.desc}`,
                description: "",
                data: weatherData,
            }
        ]);
        return Promise.resolve(list);
    }
}
exports.FyWeather = FyWeather;
