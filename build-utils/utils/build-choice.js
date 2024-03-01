const { execSync } = require("child_process");
const inquirer = require("inquirer");
const fs = require("fs-extra");

async function makeChoice(isServe) {
  const last = await useLast();

  if (last) {
    // 使用之前的选择
    writeLast({ ...last, isEnvChange: false });
    return { ...last };
  }

  let platform = undefined;
  let env = isServe ? "develop" : undefined;
  let isDevice = true;
  let isEnvChange = false;

  const lastOpts = readLast();
  platform = await selectPlatform(lastOpts.platform, isServe);
  if (!isServe) {
    env = await selectEnv(lastOpts.env);
  }

  // 是否切换了环境
  isEnvChange = lastOpts.env && lastOpts.env !== env;

  if (platform == "browser") {
    writeLast({ platform, isDevice: false });
  } else {
    const runPlatform = await selectMode(lastOpts.isDevice ? "device" : "emulator");
    isDevice = runPlatform === "device";
    writeLast({ platform, isDevice, env });

    if (isDevice) {
      devices = listDevices(platform);
      if (!devices.length) {
        throw new Error("Connected device not found.");
      }
    }
  }

  return {
    platform,
    isDevice,
    env,
    last: lastOpts,
    useLast: false,
    isEnvChange,
  };
}

async function selectPlatform(last, isServe) {
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

async function selectEnv(last) {
  const { env } = await inquirer.prompt([
    {
      message: "Build for develop、test or production",
      type: "list",
      name: "env",
      choices: ["develop", "production", "test"],
      default: last || "develop",
    },
  ]);
  return env;
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
    devices = devices.filter((device) => iosReg.test(device)).map((device) => device.match(iosReg)[1]);
  }
  return devices;
}

async function useLast() {
  const { platform, isDevice, env } = readLast();
  if (!platform) {
    return false;
  }

  let lastStr = "browser";
  let lastEnv = "develop";
  if (platform !== "browser") {
    lastStr = `${platform} ${isDevice ? "device" : "emulator"}`;
    lastEnv = env;
  }

  const { last } = await inquirer.prompt([
    {
      message: "Use last build potions?",
      type: "list",
      name: "last",
      choices: [
        {
          name: `last build on [${lastStr}] [${lastEnv}]`,
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

  return last && { platform, isDevice, env, useLast: last };
}

function readLast() {
  try {
    if (fs.existsSync("./.build.json")) {
      return fs.readJSONSync("./.build.json") || {};
    }
  } catch (error) {
    return {};
  }
  return {};
}

function writeLast(opts) {
  let data = {};
  if (fs.existsSync("./.build.json")) {
    data = fs.readJSONSync("./.build.json") || {};
  }
  fs.writeJSONSync("./.build.json", {
    ...data,
    ...opts,
  });
}

module.exports = {
  makeChoice,
  listDevices,
  selectPlatform,
  selectMode,
  selectEnv,
  useLast,
  writeLast,
  readLast,
};
