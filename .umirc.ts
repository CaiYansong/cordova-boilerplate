/**
 * .umirc.ts
 */
// @ts-ignore
import px2vw from "postcss-px-to-viewport-8-plugin";

export default {
  history: { type: "hash" },
  outputPath: "cordova/www",
  headScripts: [
    `if(!this.globalThis){this.globalThis = this;}`,
    { src: "cordova.js" },
  ],
  alias: {
    "@": "/src/",
    "@service": "/services/",
  },
  routes: [
    {
      path: "/",
      component: "@/layouts/baseLayout",
      routes: [
        { path: "/", redirect: "/home" },
        { path: "/home", component: "home" },
        { path: "/todo", component: "todo" },
        { path: "/message", component: "message" },
        { path: "/mine", component: "mine" },
        { path: "/test", component: "test" },
      ],
    },
    {
      path: "/",
      component: "@/layouts/emptyLayout",
      routes: [
        {
          path: "/login",
          component: "login",
        },
        { path: "/404", component: "404" },
      ],
    },
  ],
  // 按需添加，开启后使用 https 访问，需要配置安全证书
  // 本地开发可开启，用于解决局域网 IP 非 http 获取定位、摄像头 等无权限问题
  // https: { hosts: ["127.0.0.1", "localhost"] },
  extraPostCSSPlugins: [
    px2vw({
      // (Number) 设计稿的视口宽度，一般是 750
      viewportWidth: 750,
      // (String) 希望使用的视口单位
      viewportUnit: "vw",
      // (Number) 横屏时使用的视口宽度
      landscapeWidth: 750,
      // (String) 横屏时使用的单位
      landscapeUnit: "vw",
      // (Boolean) 媒体查询里的单位是否需要转换单位
      mediaQuery: false,
      // (Number) 设置最小的转换数值，如果为1的话，只有大于1的值会被转换
      minPixelValue: 1,
      // (Array or Regexp) 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
      exclude: [/^node_modules$/],
      /*(Array) 需要忽略的CSS选择器，不会转为视口单位，使用原有的px等单位
            如果传入的值为字符串的话，只要选择器中含有传入值就会被匹配
                例如 selectorBlackList 为 ['body'] 的话， 那么 .body-class 就会被忽略
            如果传入的值为正则表达式的话，那么就会依据CSS选择器是否匹配该正则
                例如 selectorBlackList 为 [/^body$/] , 那么 body 会被忽略，而 .body 不会*/
      selectorBlackList: [".ignore", ".hairlines"],
    }),
  ],
};
