const fs = require("fs");
const path = require("path");
const { exec, execSync } = require("child_process");
const dayjs = require("dayjs");

const { curPlatform } = require("./utils/env.js");
const cordovaDir = path.resolve(__dirname, "../cordova");

const releaseInfo = require("./data/.release-info.js");
const testInfo = require("./data/.test-info.js");

/**
 * 处理并执行 cordova run platform 命令
 */
function buildApp(opts) {
  const { platform, isServe, isDevice, env } = opts;

  if (platform === "ios") {
    // ios 复制 icon 到对应的文件夹
    const iconS = path.resolve(cordovaDir, "./www/images/ios/*");
    const iconTarget = path.resolve(
      cordovaDir,
      `./platforms/ios/${developData.name}/Images.xcassets/AppIcon.appiconset/`,
    );
    execSync("cp -f " + iconS + " " + iconTarget);
  }

  cordovaClean(platform, cordovaDir);

  let cmd = `cordova run ${platform}`;
  if (env === "production") {
    cmd += getReleaseArgs(releaseInfo);
  } else if (env === "test") {
    cmd += getReleaseArgs(testInfo);
  }
  cmd += ` ${isDevice ? "--device" : "--emulator"}`;
  const build = exec(
    cmd,
    {
      cwd: cordovaDir,
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(error, stderr);
      } else {
        console.log(stdout);
      }
      !isServe && cpApk(platform, env);
    },
  );
  build.stdout.pipe(process.stdout);
}

/**
 * cordova clean
 * @param {*} platform
 */
function cordovaClean(platform) {
  if (curPlatform === "darwin" && platform === "ios") {
    // cordova clean 的 bug，ios 下的 build 需要自己删除
    execSync("rm -rf build/", {
      cwd: path.resolve(cordovaDir, "./platforms/ios"),
      stdio: "inherit",
    });
  }

  execSync("cordova clean", {
    cwd: cordovaDir,
    stdio: "inherit",
  });

  console.log("\ncordova cleaned up!\n");
}

/**
 * 获取签名打包命令参数
 * @param {*} data
 * @returns
 */
function getReleaseArgs(data) {
  return ` --release --prod -- --keystore=${data.storeName} --storePassword=${data.storePassword} --alias=${data.alias} --password=${data.password} --packageType=${data.packageType}`;
}

/**
 * 复制并重命名 apk 文件
 * @param {string} platform
 * @param {string} env
 */
function cpApk(platform = "android", env) {
  if (platform === "android") {
    const envStr = env === "develop" ? "debug" : "release";
    const envResStr = env === "develop" ? "debug" : env === "test" ? "test" : "release";
    const dir = path.resolve(__dirname, `./cordova/platforms/android/app/build/outputs/apk/${envStr}`);

    const apkPath = path.resolve(dir, `./app-${envStr}.apk`);
    if (fs.existsSync(apkPath)) {
      exec("git rev-parse HEAD", function (err, stdout) {
        let lastCommitHash = stdout;
        lastCommitHash = lastCommitHash?.slice(0, 8);

        fs.copyFile(
          apkPath,
          path.resolve(
            dir,
            `./app-${envResStr}-${appVersion}-${dayjs().format("YYYY-MM-DD-HHmmss")}-${lastCommitHash}.apk`,
          ),
        );
      });
    }
  }
}

module.exports = {
  cordovaDir,
  buildApp,
  cordovaClean,
  getReleaseArgs,
};
