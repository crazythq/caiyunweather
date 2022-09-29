const axios = require("axios");

window.exports = {
  fyweather: {
    // 注意：键对应的是 plugin.json 中的 features.code
    mode: "list", // 列表模式
    args: {
      // 进入插件应用时调用（可选）
      enter: (action, callbackSetList) => {
        // 如果进入插件应用就要显示列表数据
        // callbackSetList([]);
      },
      // 子输入框内容变化时被调用 可选 (未设置则无搜索)
      search: (action, searchWord, callbackSetList) => {
        // 获取一些数据
        // 执行 callbackSetList 显示出来
        if (searchWord && searchWord.trim()) {
          callbackSetList([
            {
              title: searchWord,
              description: "查询天气详情",
              keyword: searchWord,
            },
          ]);
        } else {
            callbackSetList(null);
        }
      },
      // 用户选择列表中某个条目时被调用
      select: (action, itemData, callbackSetList) => {
        if (itemData.keyword) {
            const url = `http://autodev.openspeech.cn/csp/api/v2.1/weather?openId=aiuicus&clientType=android&sign=android&needMoreData=true&pageSize=7&city=${itemData.keyword}`;
            axios.get(url).then((res) => {
            console.log("res:", res);
            if (res.data.code === 0) {
                const dataList = res.data.data.list;
                const showList = [];
                const todayData = dataList[0];
                if (todayData.moreData.alert) {
                    showList.push({
                      title: "今天有天气预警，请注意！",
                      description: todayData.moreData.alert,
                      icon: res.data.data.logoUrl,
                    });
                }
                showList.push(...dataList.map((item) => ({
                    title: `${item.date} ${item.weather || ''} ${item.temp ? '当前温度' + item.temp : ''} 最低${item.low}℃ 最高${item.high}℃ ${item.humidity && item.humidity!=='未知' ? '当前湿度'+item.humidity : ''} ${item.wind} 空气质量${item.airQuality}`,
                    description: `日出时间${item.moreData.sunrise} 日落时间${item.moreData.sunset} ${item.moreData.alert ? ' 注意！' + item.moreData.alert : ''}`,
                })));
                callbackSetList(showList);
            } else {
                window.utools.showNotification(
                "天气查询失败，请输入正确的位置后重试。",
                "fyweather"
                );
            }

            //隐藏主体窗口
            // window.utools.hideMainWindow();
            // 退出插件
            // window.utools.outPlugin();
            });
        }
      },
      // 子输入框为空时的占位符，默认为字符串"搜索"
      placeholder: "请输入城市名称",
    },
  },
};
