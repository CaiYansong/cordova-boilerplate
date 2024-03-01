/* eslint-disable */
const path = require("path");
const { exec, execSync } = require("child_process");
const fs = require("fs-extra");

const buildInfo = require("./build-utils/data/.build-info.js");
const { deleteFile } = require("./build-utils/utils/file.js");
const { getIpFromDevData } = require("./build-utils/utils/string.js");
const { editConfigXML } = require("./build-utils/utils/config-xml.js");
const { makeChoice } = require("./build-utils/utils/build-choice.js");
const { buildApp } = require("./build-utils/cordova-build.js");
const { reloadPlatform } = require("./build-utils/cordova-platform.js");

const { handlePluginsAndroidId } = require("./build-utils/plugins.js");

const packageJsonData = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const appVersion = packageJsonData.version;

const isServe = process.argv.includes("--serve");

let pageUrl = "./index.html";

(async () => {
  // 选择平台、运行平台、环境
  const {
    platform,
    isDevice,
    env: _env = "develop",
    isEnvChange,
  } = await makeChoice(isServe);

  // 本地服务，环境固定为 develop
  let env = isServe ? "develop" : _env;

  if (isServe) {
    handleServe({ platform, isDevice, env, isEnvChange });
  } else {
    // 环境变更时进行相关文件数据的修改，只有环境变更才需要
    handleEnvChange({ platform, env, pageUrl, isEnvChange });

    execSync(
      `cross-env UMI_ENV=${
        env === "production" ? "prod" : "dev"
      } PAGE_ENV=${platform} npm run dev-build`,
      {
        stdio: "inherit",
      }
    );

    buildApp({
      platform,
      isDevice,
      env,
    });
  }
})();

/**
 * 处理本地页面服务的情况
 * @param {*} param
 */
function handleServe({ platform, isDevice, env, isEnvChange }) {
  const pageEnv = {
    android: "android",
    ios: "ios",
    browser: "h5",
  };
  // 清除 umi 缓存
  deleteFile("./node_modules/.cache/");

  // serve 模式下同步 platform_www 下的文件到 public
  copyPlatformsCordovaJs(platform);
  const serve = exec(
    `cross-env RUN_ENV=serve PAGE_ENV=${pageEnv[platform]} npm run dev-start -- --mode=${platform} `
  );
  serve.stdout.pipe(process.stdout);
  let firstTime = true;
  try {
    serve.stdout.on("data", (data) => {
      if (!firstTime) {
        return;
      }

      const serverUrl = getIpFromDevData(data);

      if (serverUrl) {
        firstTime = false;

        pageUrl = serverUrl.url;

        // 环境变更时进行相关文件数据的修改，只有环境变更才需要
        handleEnvChange({ platform, env, pageUrl, isEnvChange });

        process.nextTick(() => {
          if (platform === "browser") {
            exec(`open "${serverUrl.localHost}"`);
          } else {
            buildApp({
              env,
              platform,
              isServe,
              isDevice,
            });
          }
        });
      }
    });
    serve.stdout.on("error", (err) => {
      console.log("Error: ", err);
    });
  } catch (error) {}
}

/**
 * 处理环境变更相关数据
 */
function handleEnvChange({ platform, env, pageUrl, isEnvChange }) {
  // 处理 config.xml 文件内容
  handleConfigXML(pageUrl, platform, env);
  if (isEnvChange) {
    // 修改相关的 key、widgetId
    handleDataChange(platform, env);
    if (platform === "android") {
      console.log("reload cordova platform start");
      // 如果切换了环境，重装 android 平台
      reloadPlatform(platform);
      console.log("reload cordova platform end");
    }
  }
}

/**
 * 处理 XML，在 Server 模式下指向 devServer 的链接
 * @param {string} url
 */
function handleConfigXML(url = pageUrl, platform, env) {
  const cordovaConfigPath = path.resolve(__dirname, "./cordova/config.xml");
  const devData = buildInfo.getData(env);

  // if (platform === "ios") {
  //   url = "./index.html";
  // }

  // 修改 widgetId、version、name、contentSrc
  editConfigXML(cordovaConfigPath, {
    ...devData,
    version: appVersion,
    contentSrc: url,
  });
}

/**
 * 处理多环境切换数据
 * @param {string} platform
 * @param {string} env
 */
function handleDataChange(platform, env) {
  const data = buildInfo.getData(env);
  handlePluginsAndroidId(platform, data);
}

/**
 * serve 模式下同步 platform_www 下的文件到 public
 * @param {*} platform
 */
function copyPlatformsCordovaJs(platform) {
  const srcDir = `./cordova/platforms/${platform}/platform_www/`;
  const dstDir = `./public/dev-build/${platform}/`;
  fs.copySync(srcDir, dstDir);
}
