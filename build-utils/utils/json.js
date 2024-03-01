const fs = require("fs");
const _ = require("lodash");

/**
 * 编辑指定 json 文件
 * @param {*} filePath
 * @param {*} targetPath
 * @param {*} val
 */
function editJSON(filePath, targetPath, val) {
  const androidJSON = require(filePath);
  _.set(androidJSON, targetPath, val);
  fs.writeFileSync(filePath, JSON.stringify(androidJSON, null, 2));
}

module.exports = {
  editJSON,
};
