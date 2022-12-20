export const navBarHeight = "8vw";

/**
 * 计算总的 top 值
 * @param {Array} tops 所有的 top
 * @param {string} unit 单位 默认 vw
 * @returns {string} 总的 top 值
 */
export function computedTop(tops, unit = "vw") {
  return (
    (tops?.reduce((total, cur) => {
      return parseFloat(total) + parseFloat(cur);
    }, 0) || parseFloat(navBarHeight)) + unit
  );
}

/**
 * 计算总的 top 值，默认有 navBarHeight
 * @param {Array} tops 除 navBarHeight 外所有的 top
 * @param {string} unit 单位 默认 vw
 * @returns {string} 总的 top 值
 */
export function addTop(tops = [], unit = "vw") {
  let _tops = tops;
  if (typeof _tops === "string") {
    _tops = [_tops];
  }
  return computedTop([navBarHeight, ..._tops], unit);
}
