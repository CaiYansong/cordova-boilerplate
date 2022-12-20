# UMI WebApp

Cordova + UMI + React + Ant Design Mobile

- 环境配置文档：https://www.yuque.com/caiyansong/web/kvig17ztpscgfu3o

## 注意事项
- cordova@10.x
  - android@9.1.0
- 默认 https 访问关闭。开启后使用 https 访问，需要配置安全证书。
  - 开启可在 .umirc.ts 中取消注释 devServer.https: {...}

## 命令

### 安装相关资源
1. 根目录 npm install
3. cordova 目录 （确保名称为 www 的文件夹存在）
  - cd cordova
  - 确认是否存在名称为 www 的文件夹，不存在则手动新建名称为  www 的文件夹
3. cordova 目录 添加平台
  - cordova platform add android
  - cordova platform add browser
4. 安装插件
  - cordova plugin add cordova-plugin-whitelist
  - cordova plugin add cordova-plugin-android-permissions
  - cordova plugin add cordova-plugin-media-capture
  - cordova plugin add cordova-plugin-geolocation

#### https 证书配置（按需配置）
- https://www.yuque.com/caiyansong/web/cuorx0cxchg8ysui

### 本地开发
开发：根目录

- npm run start
- 上下键选择 android，回车确认
- 上下键选择 device，回车确认
- 注意：手机需要用数据线连接电脑，且手机和电脑需要在同一局域网中。

### 打包
打包：根目录

- npm run build
- 上下键选择 android，回车确认
- 上下键选择 device，回车确认
- 注意：手机需要用数据线连接电脑，才能自动安装。
- 安装包位置：cordova-umi\cordova\platforms\android\app\build\outputs\apk


### 开发注意事项
- 接口统一使用 packages/data-model 进行请求
- 行内样式单位使用 vw\vh （插件不支持行内样式单位转换）

## 问题

#### Current working directory is not a Cordova-based project.
1. 检查命令执行环境是否为 cordova 目录；
2. 检测 cordova 目录是否存在名称为 www 的文件，不存在则手动创建；

#### ENOENT: no such file or directory, open 'xxx\static\js\main.a213392c.js'
重新执行解决

#### 打包后的文件出现 xxx.xxx.xxx.xxx:xxxx 网络错误
重新打包解决

#### No Java files found that extend CordovaActivity
重新添加 android 平台
```
cordova platform rm android
cordova platform add android
```

#### Command failed with exit code 1: \cordova-react\cordova\platforms\android\gradlew cdvBuildDebug -b \cordova\platforms\android\build.gradle
重新添加 android 平台
```
cordova platform rm android
cordova platform add android
```

- cordova@11