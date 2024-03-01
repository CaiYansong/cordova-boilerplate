const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const { cordovaDir } = require("./cordova-build");
const { cpDir } = require("./utils/file");

/**
 * 重新安装平台，解决切换环境导致打包异常的问题
 * @param {*} platform
 */
function reloadPlatform(platform) {
  const cordovaPackageJsonData = JSON.parse(fs.readFileSync("./cordova/package.json", "utf8"));
  let platformVersion = cordovaPackageJsonData.devDependencies["cordova-android"]?.replace(/[^~]/, "") || "10.1.2";
  if (platformVersion) {
    platformVersion = `@${platformVersion}`;
  }
  const wwwPath = path.join(cordovaDir, "./www");
  if (!fs.existsSync(wwwPath)) {
    fs.mkdir(wwwPath);
  }
  if (!fs.existsSync(path.join(cordovaDir, "./www/logo.png"))) {
    cpDir("./public", wwwPath);
  }
  try {
    execSync(`cordova platform rm ${platform}`, {
      cwd: cordovaDir,
      stdio: "inherit",
    });
  } catch (error) {
    console.warn("error", error);
  }
  execSync(`cordova platform add ${platform}${platformVersion}`, {
    cwd: cordovaDir,
    stdio: "inherit",
  });
}

module.exports = {
  reloadPlatform,
};
