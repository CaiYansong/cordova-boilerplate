const widgetId = "com.caiyansong.app";
const testWidgetId = "com.caiyansong.app_test";
const debugWidgetId = "com.caiyansong.app_debug";

const name = "XXXXX";
const testName = "XXXXX Test";
const debugName = "XXXXX Debug";

const dataEnum = {
  production: {
    name: name,
    widgetId: widgetId,
  },
  test: {
    name: testName,
    widgetId: testWidgetId,
  },
  develop: {
    name: debugName,
    widgetId: debugWidgetId,
  },
};

function getData(env) {
  return dataEnum[env] || dataEnum.production;
}

module.exports = {
  dataEnum,
  getData,
  widgetId,
  testWidgetId,
  debugWidgetId,
};
