import { Plugin, ListItem, Setting } from "utools-helper";
import Axios, { AxiosInstance } from "axios";

export class FyWeather implements Plugin {
    code = "fyweather";
    request: AxiosInstance = null;
    // 彩云天气开放平台令牌
    token = "";
    // 纬度
    latitude = "";
    // 经度
    longitude = "";
    // 用作缓存数据
    weatherData: any = null;

    /** 获取位置信息 */
    async getLocation() {
        const timestamp = new Date().getTime();
        const url = "https://map.baidu.com/?qt=ipLocation&t=" + timestamp;

        let request = this.request;
        if (!request) {
            request = Axios.create({
                timeout: 10000,
                withCredentials: true,
            });
            this.request = request;
        }

        let locationResult = await request.get(url);
        console.log(locationResult);

        if (!locationResult?.data?.rgc) {
            const cookies = locationResult.headers["set-cookie"] as Array<string>;
            let cookieStr = "", csrfStr = "";
            cookies.forEach((cookie) => {
                cookieStr += cookie.split(";")[0] + ";";
                if (cookie.includes("ctoken")) {
                    csrfStr = cookie.match(/ctoken=(.*?);/)[1];
                }
            });
            request.interceptors.request.use(
                (config) => {
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
                },
                (error) => {
                    return Promise.reject(error);
                });
            this.request = request;

            locationResult = await request.get(url);
        }

        const location = locationResult.data.rgc.result.location;
        this.latitude = location?.lat || "";
        this.longitude = location?.lng || "";
        Setting.Set("latitude", this.latitude);
        Setting.Set("longitude", this.longitude);
        return location;
    }

    /** 获取天气信息 */
    async getWeather() {
        if (!this.longitude || !this.latitude) {
            await this.getLocation();
        }
        const url = `https://api.caiyunapp.com/v2.6/${this.token}/${this.longitude},${this.latitude}/weather?alert=true&dailysteps=1&hourlysteps=24`;
        // console.log(url);
        const weatherRes = await Axios.get(url);
        if (weatherRes && weatherRes.data && weatherRes.data.status == "ok") {
            return weatherRes.data.result;
        }
        return null;
    }

    /** 进入插件时调用 */
    async enter(): Promise<ListItem[]> {
        this.token = Setting.Get("token");
        this.latitude = Setting.Get("latitude");
        this.longitude = Setting.Get("longitude");

        return this.search("");
    }

    /** 输入关键字时调用 */
    async search(keyword: string): Promise<ListItem[]> {
        if (this.token) {
            return Promise.resolve([{
                title: "当前位置天气",
                description: "显示当前位置天气",
                data: null,
                operate: "current"
            }]);
        } else {
            utools.showNotification("请先进行设置");
            return Promise.resolve([{
                title: "请先进行设置",
                description: '搜索"天气设置"进行设置',
                data: null,
            }]);
        }
    }

    /** 选择一个选项时调用 */
    async select(item: ListItem): Promise<ListItem[]> {
        // const weatherResult = await this.getWeather();
        const weatherData = await this.getWeather() as any;
        if (!weatherData) {
            utools.showNotification("获取天气失败");
            return Promise.resolve([{
                title: "获取天气失败",
                description: "请重新加载插件",
                data: null,
            }]);
        }

        this.weatherData = weatherData;
        const list: ListItem[] = [];
        if (weatherData.alert?.content?.length) {
            list.push(weatherData.alert.content.map((o: any) => ({
                title: (o.status || "") + o.title + " " + o.description,
                description: "来源：" + o.source,
            })));
        }
        const realtime = weatherData.realtime;
        list.push(...[
            {
                title: `温度：${realtime.temperature}，相对湿度：${realtime.humidity}，地面气压：${realtime.pressure}，水平能见度：${realtime.visibility}，总云量：${realtime.cloudrate}，天气：${realtime.skycon}`,
                description: weatherData?.forecast_keypoint || "",
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
