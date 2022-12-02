/* eslint-disable */
const path = require("path");
const { exec, execSync } = require("child_process");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const iconv = require("iconv-lite");

const curPlatform = process.platform.toLowerCase();

console.log("curPlatform", curPlatform);

const isServe = process.argv.includes("--serve");

let url = "/";
let mode = isServe ? "SERVE" : "BUILD";

const ip = getLanIp();

(async () => {
  const { platform, isDevice } = await makeChoice();

  if (isServe) {
    // 清除 umi 缓存
    deleteFile("./node_modules/.cache/");
    // 处理 umi 相关配置
    handleUmirc({ ip });

    copyPlatformsCordovaJs(platform);
    copyPlatformsHtml(platform);

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
      const localMatch = dataStr.match(
        /Local:[\s]+(https?:\/\/localhost:[\d]+)/
      );
      if (localMatch && localMatch.length > 1) {
        localHost = localMatch[1];
      }

      const lanMatch = dataStr.match(/Network:[\s]+(https?:\/\/[\d.:]+)/);
      if (lanMatch && lanMatch.length > 1) {
        lanHost = lanMatch[1];
      }

      if (localHost && lanHost) {
        firstTime = false;

        const protocol = lanHost.replace(/(https?:\/\/)[\d.]+[\d:]+/, "$1");
        const port = lanHost.replace(/https?:\/\/[\d.]+([\d:]+)/, "$1");
        url = `${protocol}${ip}${port}`;

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
    // 生成 index.html
    fs.writeFileSync(
      "./public/index.html",
      fs.readFileSync("./public/index-tpl.html", "utf-8")
    );
    // 恢复 umi 相关配置
    handleUmirc(false);

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

// serve 模式下同步 platform_www 下的文件到 public
function copyPlatformsCordovaJs(platform) {
  const srcDir = `./cordova/platforms/${platform}/platform_www/`;
  const dstDir = `./public/dev-build/${platform}/`;
  fs.copySync(srcDir, dstDir);
}

function copyPlatformsHtml(platform) {
  // 需手动暂存一份正确的 index.html -> index-tpl.html
  const srcFile = `./public/index-tpl.html`;
  // 处理相关内容
  const dstFile = `./public/index.html`;
  const lines = fs.readFileSync(srcFile, "utf-8").split(/\r?\n/g);

  const regexImportComment = /\s+<!-- 引入 cordova.js -->/;
  const importCommentIndex = lines.findIndex((line) =>
    line.match(regexImportComment)
  );
  if (importCommentIndex >= 0) {
    lines[
      importCommentIndex + 1
    ] = `    <script src="/dev-build/${platform}/cordova.js"></script>`;
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
  const { platform, isServe, lanHost, isDevice } = opts;

  cleanUp(platform);

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

/**
  // TODO: 优化
 * 处理 umi 配置文件
 */
function handleUmirc(params) {
  const filePath = "./.umirc.ts";
  if (!params) {
    // 恢复 umi 相关配置
    let umircStr = fs.readFileSync(filePath, "utf-8");

    // 添加 https host
    // 解决 getLocation 本地开发 http 无法使用的问题
    umircStr = umircStr.replace(
      /https: { hosts: \[("[^"]+",? ?)?\] },/,
      `https: { hosts: [] },`
    );

    fs.writeFileSync(filePath, umircStr);
    return;
  }
  const { ip } = params;
  let umircStr = fs.readFileSync(filePath, "utf-8");

  // 添加 https host
  // 解决 getLocation 本地开发 http 无法使用的问题
  umircStr = umircStr.replace(
    /https: { hosts: \[\] },/,
    `https: { hosts: ["${ip}"] },`
  );

  fs.writeFileSync(filePath, umircStr);
}

/**
 * 获取本机局域网 IP
 * @returns
 */
function getLanIp() {
  let ip = "";
  // 获取无线局域网 IPv4 地址
  if (curPlatform === "win32") {
    let ipRes = execSync(`ipconfig`);
    ipRes = iconv.decode(ipRes, "gbk");
    ipRes = ipRes.replace(
      /[\s\S\n\r]+无线局域网适配器 WLAN:([\s\S\n\r]+)/,
      "$1"
    );
    const localWanMatch = ipRes.match(/IPv4 地址.+: +([\d.:]+)/);
    if (localWanMatch && localWanMatch.length > 1) {
      ip = localWanMatch[1];
    }
  } else if (curPlatform === "darwin") {
    let ipRes = execSync(`ifconfig | grep 'inet'`);
    ipRes = ipRes.toString();
    ipRes = ipRes.replace(/[\s\S\n\r]+inet 127.0.0.1([\s\S\n\r]+)/, "$1");
    const localWanMatch = ipRes.match(/inet +([\d.:]+)/);
    if (localWanMatch && localWanMatch.length > 1) {
      ip = localWanMatch[1];
    }
  }

  return ip;
}

/**
 * 删除文件或文件夹
 * @param {string} target
 */
function deleteFile(target) {
  const src = path.normalize(target);
  if (curPlatform === "win32") {
    // TODO: 优化
    removeFolder(src);
  } else if (curPlatform === "darwin") {
    execSync(`rm -rf ${src}`);
  }
}

function removeFolder(filePath) {
  // 判断文件是否存在
  if (fs.existsSync(filePath)) {
    const files = fs.readdirSync(filePath);
    files.forEach((file) => {
      const nextFilePath = `${filePath}/${file}`;
      // 获取文件状态
      const states = fs.statSync(nextFilePath);
      if (states.isDirectory()) {
        // 递归删除
        removeFolder(nextFilePath);
      } else {
        // 删除文件或符号链接
        fs.unlinkSync(nextFilePath);
      }
    });
    fs.rmdirSync(filePath);
  } else {
    console.log("文件不存在");
  }
}
