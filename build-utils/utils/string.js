const { getLanIp } = require("./env");

let localHost = "";
let lanHost = "";

/**
 * 从 umi dev 的日志中获取 ip
 * @param {*} data
 */
function getIpFromDevData(data) {

  const dataStr = data.toString().trim();
  const localMatch = dataStr.match(/Local:[\s]+(https?:\/\/localhost:[\d]+)/);
  if (localMatch && localMatch.length > 1) {
    localHost = localMatch[1];
  }

  const lanMatch = dataStr.match(/Network:[\s]+(https?:\/\/[\d.:]+)/);
  if (lanMatch && lanMatch.length > 1) {
    lanHost = lanMatch[1];
  }

  if (localHost && lanHost) {
    const ip = getLanIp();
    const protocol = lanHost.replace(/(https?:\/\/)[\d.]+[\d:]+/, "$1");
    const port = lanHost.replace(/https?:\/\/[\d.]+([\d:]+)/, "$1");
    return { localHost, lanHost, url: `${protocol}${ip}${port}` };
  }
}

/**
 * 替换内容
 * @param {string} pathStr
 * @param {RegExp} reg
 * @param {string} data
 */
function replaceContent(pathStr, reg, data = "") {
  try {
    if (!(pathStr && reg)) {
      return;
    }
    const targetPath = path.resolve(__dirname, pathStr);
    let targetStr = fs.readFileSync(targetPath, "utf-8");
    targetStr = targetStr.replace(reg, data);
    fs.writeFileSync(targetPath, targetStr);
  } catch (error) {}
}
module.exports = {
  getIpFromDevData,
  replaceContent,
};
