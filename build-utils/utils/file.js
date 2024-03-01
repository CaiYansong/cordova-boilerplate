/* eslint-disable */
const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs-extra");

const { curPlatform } = require("./env");

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

/**
 * 递归删除文件夹
 * @param {*} filePath
 */
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
    // console.log("文件不存在");
  }
}

/**
 * 将源文件夹复制到目标
 * @param {*} dirPath
 * @param {*} targetPath
 */
function cpDir(dirPath, targetPath) {
  // 将源文件夹复制到目标
  const err = fs.copySync(dirPath, targetPath);
  if (err) {
    console.log("An error occured while copying the folder.");
    return console.error(err);
  }
  console.log("Copy completed!");
}

module.exports = {
  curPlatform,
  deleteFile,
  removeFolder,
  cpDir,
};
