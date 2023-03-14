const path = require("path");
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
