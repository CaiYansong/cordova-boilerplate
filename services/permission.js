/*
在存在 window 之后才执行该文件
import { getAllPermissions } from "../services/permission";
// React:
useEffect(() => {
    getAllPermissions();
}, []);
// Vue:
created() {
    getAllPermissions();
}
*/

function getAllPermissions() {
  console.log("getAllPermissions", window.cordova);
  const cordova = window.cordova || {};
  if (!cordova.plugins) {
    console.log("获取权限无效");
    return;
  }
  const permissions = window.cordova.plugins.permissions;
  return new Promise((resolve, reject) => {
    const list = [
      permissions.ACCESS_COARSE_LOCATION,
      permissions.ACCESS_FINE_LOCATION,
      permissions.CAMERA,
      permissions.WRITE_EXTERNAL_STORAGE,
      permissions.READ_EXTERNAL_STORAGE,
    ];
    permissions.hasPermission(
      list,
      (status) => {
        console.log("是否有权限判断：", status);
        if (!status.hasPermission) {
          permissions.requestPermissions(
            list,
            function (status) {
              if (!status.hasPermission) {
                reject("requestPermissions status.hasPermission: " + status.hasPermission);
              } else {
                resolve();
              }
            },
            reject
          );
        }
      },
      reject
    );
  });
}

export { getAllPermissions };
