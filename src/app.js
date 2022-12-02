import { getAllPermissions } from "@service/permission";
import { loadModules } from '@/pages/test/face-utils';

// 加载人脸检测模型
loadModules();
// 获取权限
getAllPermissions();

console.log("app.js");
