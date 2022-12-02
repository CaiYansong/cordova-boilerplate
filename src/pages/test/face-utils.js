import * as faceapi from "face-api.js";

/*
code: 
200: success
400: error
500: loading
*/

export class FaceTool {
  /**
   * @constructor
   * @param {Object} params
   * @param {Object} modulesConf params.modulesConf  加载模型相关参数
   * @param {Array} modules params.modulesConf.modules 加载模型列表数组
   * @param {string} modulePath params.modulesConf.modulePath 加载模型路径
   */
  constructor(params) {
    const {
      modulesConf,
      size,
      delay,
      videoEl,
      canvasEl,
      detectType,
      detectFaceOptions,
    } = params || {};

    // 模型相关配置项
    this.modulesConf = modulesConf || {};
    // 相关元素： video canvas
    this.videoEl = videoEl;
    this.canvasEl = canvasEl;

    // 检测类型
    // detectSingleFace
    // detectAllFaces
    this.detectType = detectType || "detectSingleFace";

    // 人脸检测算法参数
    // new faceapi.SsdMobilenetv1Options()
    this.detectFaceOptions =
      detectFaceOptions || new faceapi.TinyFaceDetectorOptions();

    // 视频图片大小
    this.size = size || {
      width: 300,
      height: 300,
    };

    // 获取定时器间隔时间
    this.delay = delay ?? 1000;

    this.timer = null;

    this.detectLoading = false;
  }

  /**
   * 加载训练好的模型
   * @param {Array} customizeModules 自定义加载模型
   * @param {string} modulePath 模型路径
   * // faceRecognitionNet 识别人脸
   * // faceLandmark68Net 识别脸部特征用于 mobilenet 算法
   * // ssdMobilenetv1 google 开源 AI 算法除库包含分类和线性回归
   * // tinyFaceDetector 比 Google 的 mobilenet 更轻量级，速度更快一点
   * // faceLandmark68TinyNet 识别脸部特征用于tiny算法
   * // faceExpressionNet 识别表情,开心，沮丧，普通
   * // ageGenderNet 识别性别和年龄
   * // mtcnn  多任务CNN算法，一开浏览器就卡死?
   * // tinyYolov2 识别身体轮廓的算法
   * @returns Promise
   */
  loadModules(_modules, _modulePath) {
    const { modules, modulePath } = this.modulesConf;

    const modulesList = _modules ||
      modules || [
        "faceRecognitionNet",
        "faceLandmark68Net",
        "ssdMobilenetv1",
        "tinyFaceDetector",
        "faceLandmark68TinyNet",
        "faceExpressionNet",
        "mtcnn",
      ];

    return Promise.all(
      modulesList
        ?.filter((it) => it)
        .map((module) =>
          faceapi.nets[module].loadFromUri(
            _modulePath || modulePath || "/models"
          )
        )
    ).catch((err) => {
      console.error("Error loadModules: ", err);
    });
  }

  /**
   * 从视频中获取人脸（定时器检测）
   * @param {Object} opt 配置项
   * @param {Element} videoEl video Element
   * @param {Element} canvasEl canvas Element
   * @returns
   */
  getFaceFromVideo(opt, _videoEl, _canvasEl) {
    if (typeof this.timer === "number") {
      console.warn("Warn getFaceFromVideo loading...", this.timer);
      return Promise.reject({
        code: 500,
        msg: "Warn getFaceFromVideo 人脸检测执行中，请执行结束后重试...",
      });
    }
    if (_videoEl) {
      this.videoEl = _videoEl;
    }
    if (this._canvasEl) {
      this.canvasEl = _canvasEl;
    }

    return new Promise((resolve, reject) => {
      const { delay = this.delay, size = this.size } = opt || {};

      this.timer = setInterval(() => {
        if (this.detectLoading) {
          return;
        }
        this.detectFace()
          .then(resolve)
          .catch((err, ...errs) => {
            // 处理 loading 逻辑
            if (err.code === 500) {
              console.warn(err.msg);
              return;
            }
            reject(err, ...errs);
          });
      }, delay);
    });
  }

  /**
   * 单次人脸检测并处理结果
   * @returns
   */
  async detectFace(singleDetect) {
    if (this.detectLoading) {
      return Promise.reject({
        code: 500,
        msg: "Warn detectFace 人脸检测执行中，请执行结束后重试...",
      });
    }
    this.detectLoading = true;
    return new Promise(async (resolve, reject) => {
      let detections = null;
      try {
        // 获取检测结果
        detections = await this._detectFace();
      } catch (error) {
        reject({
          code: 400,
          msg: error,
        });
        console.error("Error detectFace: ", error);
      }

      if (detections && detections.length > 0) {
        // 处理识别结果
        const res = this._handleDetectRes(detections);
        resolve({
          code: 200,
          data: res,
        });
      } else if (singleDetect) {
        // 单次检测返回失败结果
        reject({
          code: 400,
          msg: "detectFace: No results for this detect.",
        });
      }

      this.detectLoading = false;
    });
  }

  /**
   * 使用 faceAPI 进行人脸检测
   */
  async _detectFace() {
    try {
      const { videoEl } = this;
      // 使用 faceAPI 获取检测结果
      let detections = await faceapi[
        // 识别人脸
        this.detectType
      ](videoEl, this.detectFaceOptions)
        // 检测 68 个人脸标志点
        .withFaceLandmarks();
      // 识别面部表情
      // .withFaceExpressions();

      // 结果数据为对象时转为数组（detectSingleFace 时使用）
      if (typeof detections === "object" && !Array.isArray(detections)) {
        detections = [detections];
      }
      return Promise.resolve(detections);
    } catch (error) {
      console.error("Error _detectFace: ", error);
      return Promise.reject(error);
    }
  }

  /**
   * 处理检测结果
   * @param {Array} detections
   */
  _handleDetectRes(detections) {
    if (!detections || detections.length <= 0) {
      console.warn("Warn _handleDetectRes detections not fount", detections);
      return;
    }
    const { canvasEl, videoEl, size } = this;

    // 匹配尺寸
    faceapi.matchDimensions(canvasEl, videoEl);

    // 调整检测到的框的大小，以防显示的图像与原始图像的大小不同
    const resizedDetections = faceapi.resizeResults(detections, size);

    // 绘制摄像头图片到画布中
    canvasEl.getContext("2d").drawImage(videoEl, 0, 0, size.width, size.height);

    const faceImg = this.getResImg();

    // 将检测框绘制到画布中
    faceapi.draw.drawDetections(canvasEl, resizedDetections);
    const faceResImg = this.getResImg();

    // 绘制人脸识别点位到画布中
    faceapi.draw.drawFaceLandmarks(canvasEl, resizedDetections);

    const faceLandmarksImg = this.getResImg();

    this.closeDetect();

    return {
      detections,
      resizedDetections,
      faceImg,
      faceResImg,
      faceLandmarksImg,
    };
  }

  /**
   * 获取 canvas 中的结果
   * @returns
   */
  getResImg() {
    return this.canvasEl.toDataURL("image/png");
  }

  /**
   * 关闭人脸检测，清除定时器
   */
  closeDetect() {
    clearInterval(this.timer);
    this.timer = null;
    this.detectLoading = false;
  }
}

export default FaceTool;
