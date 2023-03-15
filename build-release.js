const path = require("path");
const fs = require("fs-extra");
const { exec, execSync } = require("child_process");

const releaseInfo = require("./.release-info.js");

const curPlatform = process.platform.toLowerCase();

/*
const storeName = "xxx.jks";

const storePassword = "";

const alias = "";

const password = "";

const packageType = "apk";

module.exports = {
  storeName,
  storePassword,
  alias,
  password,
  packageType,
};
*/

function buildRelease() {
  handleXML("BUILD", "/");
  execSync("npm run dev-build", { stdio: "inherit" });
  cleanUp();
  const buildCmd = `cordova run android --release --prod -- --keystore=${releaseInfo.storeName} --storePassword=${releaseInfo.storePassword} --alias=${releaseInfo.alias} --password=${releaseInfo.password} --packageType=${releaseInfo.packageType}`;

  const build = exec(
    buildCmd,
    {
      cwd: path.resolve(__dirname, "./cordova"),
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(error, stderr);
      } else {
        console.log(stdout);
      }
    },
  );
  build.stdout.pipe(process.stdout);
}

/**
 * 处理 XML，在 Server 模式下指向 devServer 的链接
 * @param {string} mode
 * @param {string} url
 */
function handleXML(mode, url = "/") {
  const cordovaConfigPath = path.resolve(__dirname, "./cordova/config.xml");

  let cordovaConfig = fs.readFileSync(cordovaConfigPath, "utf-8");
  const lines = cordovaConfig.split(/\r?\n/g).reverse();

  const regexContent = /\s+<content/;
  const contentIndex = lines.findIndex((line) => line.match(regexContent));
  if (contentIndex >= 0) {
    lines[contentIndex] = `  <content src="${url}" />`;
  }

  const iosDevComment = /\s+<!-- iOS 调试模式允许 Http -->/;
  const iosDevIndex = lines.findIndex((line) => line.match(iosDevComment));
  if (iosDevIndex >= 0) {
    if (mode === "SERVE") {
      lines[iosDevIndex - 1] = `  <allow-navigation href="${url}" />`;
    } else {
      lines[iosDevIndex - 1] = `  <!-- <allow-navigation href="${url}" /> -->`;
    }
  }

  cordovaConfig = lines.reverse().join("\n");
  fs.writeFileSync(cordovaConfigPath, cordovaConfig);
}

function cleanUp(platform) {
  if (curPlatform === "darwin" && platform === "ios") {
    // cordova clean 的 bug，ios 下的 build 需要自己删除
    execSync("rm -rf build/", {
      cwd: "./cordova/platforms/ios",
      stdio: "inherit",
    });
  }

  execSync("cordova clean", {
    cwd: path.resolve(__dirname, "./cordova"),
    stdio: "inherit",
  });

  console.log("\ncordova cleaned up!\n");
}

buildRelease();
