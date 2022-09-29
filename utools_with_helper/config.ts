import { IConfigItem } from "utools-helper";

export const config: IConfigItem[] = [
  {
    name: "token",
    label: "天气令牌",
    type: "input",
    placeholder: "配置彩云天气开放平台天气令牌",
    required: true,
    default: "",
    tips: "请参考《彩云天气开放平台注册步骤》(https://www.yuque.com/docs/share/fcf0983b-554e-47f5-a6d9-8ef7577b821c)"
  },
  {
    name: "latitude",
    label: "当前位置纬度",
    type: "input",
    placeholder: "配置当前位置纬度",
    required: false,
    default: "",
  },
  {
    name: "longitude",
    label: "当前位置经度",
    type: "input",
    placeholder: "配置当前位置经度",
    required: false,
    default: "",
  },
];
