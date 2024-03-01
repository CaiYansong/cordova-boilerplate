const fs = require("fs");
const path = require("path");

const { cordovaDir } = require("./cordova-build.js");
const { editJSON } = require("./utils/json.js");

function handlePluginsAndroidId(platform, widgetId) {
  if (platform !== "android") {
    return;
  }
  try {
    const androidJSONPath = path.resolve(cordovaDir, "./plugins/android.json");
    const data = require(androidJSONPath);
    const installed_plugins = Object.keys(data.installed_plugins);
    const dependent_plugins = Object.keys(data.dependent_plugins);

    installed_plugins.forEach((key) => {
      data.installed_plugins[key].PACKAGE_NAME = widgetId;
    });
    dependent_plugins.forEach((key) => {
      data.dependent_plugins[key].PACKAGE_NAME = widgetId;
    });

    fs.writeFileSync(androidJSONPath, JSON.stringify(data, null, 2));
  } catch (error) {}
}

module.exports = {
  handlePluginsAndroidId,
};
