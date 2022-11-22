/* eslint-disable */
const path = require("path");
const { exec, execSync } = require("child_process");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const iconv = require("iconv-lite");

const isServe = process.argv.includes("--serve");

const curPlatform = process.platform.toLowerCase();

let url = "/";
let mode = isServe ? "SERVE" : "BUILD";

(async () => {
  const { platform, isDevice } = await makeChoice();

  if (isServe) {
    copyPlatformsCordovaJs(platform);
    copyPlatformsHtml(platform);

    // execSync(`npm run dev-build -- --mode=${platform}`, { stdio: "inherit" });
    const serve = exec(`npm run dev-start -- --mode=${platform}`);
    serve.stdout.pipe(process.stdout);
    let firstTime = true;
    let localHost = "";
    let lanHost = "";
    serve.stdout.on("data", (data) => {
      if (!firstTime) {
        return;
      }

      const dataStr = data.toString().trim();
      const localMatch = dataStr.match(/Local:[\s]+(http:\/\/localhost:[\d]+)/);
      if (localMatch && localMatch.length > 1) {
        localHost = localMatch[1];
      }

      const lanMatch = dataStr.match(/Network:[\s]+(http:\/\/[\d.:]+)/);
      if (lanMatch && lanMatch.length > 1) {
        lanHost = lanMatch[1];
      }

      if (localHost && lanHost) {
        firstTime = false;

        // 获取无线局域网 IPv4 地址
        // TODO: 确认是否必须
        if (curPlatform === "win32") {
          let ipRes = execSync(`ipconfig`);
          ipRes = iconv.decode(ipRes, "gbk");
          ipRes = ipRes.replace(
            /[\s\S\n\r]+无线局域网适配器 WLAN:([\s\S\n\r]+)/,
            "$1"
          );
          const localWanMatch = ipRes.match(/IPv4 地址.+: +([\d.:]+)/);
          if (localWanMatch && localWanMatch.length > 1) {
            const port = lanHost.replace(/http:\/\/[\d.]+([\d:]+)/, "$1");
            lanHost = `http://${localWanMatch[1]}${port}`;
          }
        } else if (curPlatform === "darwin") {
          let ipRes = execSync(`ifconfig | grep 'inet'`);
          ipRes = ipRes.toString();
          ipRes = ipRes.replace(/[\s\S\n\r]+inet 127.0.0.1([\s\S\n\r]+)/, "$1");
          const localWanMatch = ipRes.match(/inet +([\d.:]+)/);
          if (localWanMatch && localWanMatch.length > 1) {
            const port = lanHost.replace(/http:\/\/[\d.]+([\d:]+)/, "$1");
            lanHost = `http://${localWanMatch[1]}${port}`;
          }
        }

        url = lanHost;
        console.log("lanHost", lanHost);

        handleXML(mode, url);

        process.nextTick(() => {
          if (platform === "browser") {
            exec(`open "${localHost}"`);
          } else {
            buildApp({
              platform,
              isServe,
              lanHost,
              isDevice,
            });
          }
        });
      }
    });
    serve.stdout.on("error", (err) => {
      console.error("Error: ", err);
    });
  } else {
    handleXML(mode, url);
    execSync("npm run dev-build", { stdio: "inherit" });
    buildApp({
      platform,
      isDevice,
    });
  }
})();

function writeLast(opts) {
  fs.writeJSONSync("./.build.json", opts);
}
function readLast() {
  if (fs.existsSync("./.build.json")) {
    return fs.readJSONSync("./.build.json");
  } else {
    return {};
  }
}

async function makeChoice() {
  const last = await useLast();
  let platform = null;
  let isDevice = true;
  if (last) {
    platform = last.platform;
    isDevice = last.isDevice;
    writeLast({ platform, isDevice });
  } else {
    const lastOpts = readLast();
    platform = await selectPlatform(lastOpts.platform);

    if (platform == "browser") {
      writeLast({ platform, isDevice: false });
    } else {
      const mode = await selectMode(lastOpts.isDevice ? "device" : "emulator");
      isDevice = mode === "device";
      writeLast({ platform, isDevice });

      if (isDevice) {
        devices = listDevices(platform);
        if (!devices.length) {
          throw new Error("Connected device not found.");
        }
      }
    }
  }

  return {
    platform,
    isDevice,
  };
}

function cleanUp() {
  // cordova clean 的 bug，ios 下的 build 需要自己删除
  // execSync('rm -rf build/', {
  //   cwd: './cordova/platforms/ios',
  //   stdio: 'inherit',
  // });

  execSync("cordova clean", {
    cwd: path.resolve(__dirname, "./cordova"),
    stdio: "inherit",
  });

  console.log("\ncordova cleaned up!\n");
}

// serve 模式下同步 platform_www 下的文件到 public
function copyPlatformsCordovaJs(platform) {
  const srcDir = `./cordova/platforms/${platform}/platform_www/`;
  const dstDir = `./public/dev-build/${platform}/`;
  fs.copySync(srcDir, dstDir);
}

function copyPlatformsHtml(platform) {
  const srcFile = `./public/index.html`;
  const dstFile = `./public/dev-build/index-${platform}.html`;
  const lines = fs.readFileSync(srcFile, "utf-8").split(/\r?\n/g);

  const regexImportComment = /\s+<!-- 引入 cordova.js -->/;
  const importCommentIndex = lines.findIndex((line) =>
    line.match(regexImportComment)
  );
  if (importCommentIndex >= 0) {
    lines[
      importCommentIndex + 1
    ] = `    <script src="dev-build/${platform}/cordova.js"></script>`;
  }

  if (platform === "browser") {
    const regexDisableComment =
      /\s+<!-- 调试模式下 platform===browser 时禁用网页端 CSP -->/;
    const disableCommentIndex = lines.findIndex((line) =>
      line.match(regexDisableComment)
    );
    if (disableCommentIndex >= 0 && platform === "browser") {
      const cspLine = lines[disableCommentIndex + 1];
      lines[disableCommentIndex + 1] = cspLine
        .replace("<meta", "<!-- <meta")
        .replace(/>$/, "> -->");
    }
  }

  fs.writeFileSync(dstFile, lines.join("\n"));
}

function buildApp(opts) {
  cleanUp();

  const { platform, isServe, lanHost, isDevice } = opts;

  let cmd = `cordova run ${platform}`;
  if (isServe) {
    cmd += ` --SERVE_ADDR=${lanHost}`;
  }
  cmd += ` ${isDevice ? "--device" : "--emulator"}`;
  const build = exec(
    cmd,
    {
      cwd: path.resolve(__dirname, "./cordova"),
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(error, stderr);
      } else {
        console.log(stdout);
      }
    }
  );
  build.stdout.pipe(process.stdout);
}

async function useLast() {
  const { platform, isDevice } = readLast();
  if (!platform) {
    return false;
  }

  let lastStr = "browser";
  if (platform !== "browser") {
    lastStr = `${platform} ${isDevice ? "device" : "emulator"}`;
  }

  const { last } = await inquirer.prompt([
    {
      message: "Use last build potions?",
      type: "list",
      name: "last",
      choices: [
        {
          name: `last build on [${lastStr}]`,
          value: true,
        },
        {
          name: `select again`,
          value: false,
        },
      ],
      default: "device",
    },
  ]);
  return last && { platform, isDevice };
}

async function selectPlatform(last) {
  const platforms = ["android", "ios"];
  if (isServe) {
    platforms.unshift("browser");
  }

  const { platform } = await inquirer.prompt([
    {
      message: "Which platform?",
      type: "list",
      name: "platform",
      choices: platforms,
      default: last || "android",
    },
  ]);
  return platform;
}

async function selectMode(last) {
  const { mode } = await inquirer.prompt([
    {
      message: "Run on device or emulator?",
      type: "list",
      name: "mode",
      choices: ["device", "emulator"],
      default: last || "device",
    },
  ]);
  return mode;
}

function listDevices(platform) {
  let devices = [];
  if (platform === "android") {
    let devicesStr = execSync("adb devices").toString();
    devicesStr = devicesStr.replace("List of devices attached", "").trim();
    devices = devicesStr.split(/\r?\n/g);
    devices = devices
      .map((device) => device.replace(/device$/, "").trim())
      .filter((device) => !device.startsWith("emulator-"));
  }
  if (platform === "ios") {
    let devicesStr = execSync("xcrun xctrace list devices").toString();
    devicesStr = devicesStr
      .replace(/^== Devices ==/, "")
      .replace(/== Simulators ==[\w\W]*$/, "")
      .trim();
    devices = devicesStr.split(/\r?\n/g);
    const iosReg = /^[\w\W]* \([0-9.]+\) \(([0-9a-f]+)\)$/;
    devices = devices
      .filter((device) => iosReg.test(device))
      .map((device) => device.match(iosReg)[1]);
  }
  return devices;
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
    lines[contentIndex] = `    <content src="${url}" />`;
  }

  const iosDevComment = /\s+<!-- iOS 调试模式允许 Http -->/;
  const iosDevIndex = lines.findIndex((line) => line.match(iosDevComment));
  if (iosDevIndex >= 0) {
    if (mode === "SERVE") {
      lines[iosDevIndex - 1] = `    <allow-navigation href="${url}" />`;
    } else {
      lines[
        iosDevIndex - 1
      ] = `    <!-- <allow-navigation href="${url}" /> -->`;
    }
  }

  cordovaConfig = lines.reverse().join("\n");
  fs.writeFileSync(cordovaConfigPath, cordovaConfig);
}
