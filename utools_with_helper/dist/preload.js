"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utools_helper_1 = require("utools-helper");
const config_1 = require("./config");
const fyweather_1 = require("./fyweather");
(0, utools_helper_1.InitPlugins)([new fyweather_1.FyWeather(), utools_helper_1.Setting.Init("fyweather-setting", config_1.config)]);
