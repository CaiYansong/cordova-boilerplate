const fs = require("fs");

function editWidgetId(cordovaConfig, widgetId) {
  return cordovaConfig.replace(/<widget +id=["'][^"']+["']/, `<widget id="${widgetId}"`);
}

function editVersion(cordovaConfig, version) {
  return cordovaConfig.replace(/(<widget +id=["'][^"']+["']) *version=["'][^"']+["']/, `$1 version="${version}"`);
}

function editName(cordovaConfig, name) {
  return cordovaConfig.replace(/<name>[^<]*<\/name>/, `<name>${name}<\/name>`);
}

function editContentSrc(cordovaConfig, src) {
  return cordovaConfig.replace(/<content src="[^"']+" \/>/, `<content src="${src}" />`);
}

const configEnum = {
  widgetId: editWidgetId,
  version: editVersion,
  name: editName,
  contentSrc: editContentSrc,
};

function editConfigXML(filePath, data) {
  let cordovaConfig = fs.readFileSync(filePath, "utf-8");
  for (const key in data) {
    const fn = configEnum[key];
    if (fn) {
      cordovaConfig = fn(cordovaConfig, data[key]);
    }
  }
  fs.writeFileSync(filePath, cordovaConfig);
}

module.exports = {
  editConfigXML,
  editWidgetId,
  editVersion,
  editName,
  editContentSrc,
};
