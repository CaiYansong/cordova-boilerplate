/**
 * 获取 url 参数
 * @param {string} key 参数 key
 * @param {string} url 需要包含协议
 * @returns
 */
export function getUrlParam(key, url = window.location.href) {
  const regStr = new RegExp(`(${key}=)(.*?)([&]|$)`);
  const matchResult = url.match(regStr);
  return matchResult && matchResult.length > 2 ? matchResult[2] : "";
}
