/* eslint-disable */
const { execSync } = require("child_process");
const iconv = require("iconv-lite");

const curPlatform = process.platform.toLowerCase();

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
    ipRes = ipRes.replace(/[\s\S\n\r]+无线局域网适配器 WLAN:([\s\S\n\r]+)/, "$1");
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

module.exports = {
  curPlatform,
  getLanIp,
};
