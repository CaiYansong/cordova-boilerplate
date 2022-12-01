import * as faceapi from "face-api.js";

export class FaceTool {
  constructor(params) {
    const { modulesConf, size, delay, videoEl, canvasEl } = params || {};

    // 模型相关配置项
    this.modulesConf = modulesConf || {};
    // 相关元素： video canvas
    this.videoEl = videoEl;
    this.canvasEl = canvasEl;

    // 视频图片大小
    this.size = size || {
      width: 300,
      height: 300,
    };
    // 获取定时器间隔时间
    this.delay = delay ?? 1000;

    this.timer = null;
  }

  /**
   * 加载训练好的模型
   * @param {Array} customizeModules 自定义加载模型 
   * @param {string} modulePath 模型路径
    // faceRecognitionNet 识别人脸
    // faceLandmark68Net 识别脸部特征用于 mobilenet 算法
    // ssdMobilenetv1 google 开源 AI 算法除库包含分类和线性回归
    // tinyFaceDetector 比 Google 的 mobilenet 更轻量级，速度更快一点
    // faceLandmark68TinyNet 识别脸部特征用于tiny算法
    // faceExpressionNet 识别表情,开心，沮丧，普通
    // ageGenderNet 识别性别和年龄
    // mtcnn  多任务CNN算法，一开浏览器就卡死?
    // tinyYolov2 识别身体轮廓的算法
  * @returns 
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
   * 从视频中获取人脸
   * @param {Object} opt 配置项
   * @param {Element} videoEl video Element
   * @param {Element} canvasEl canvas Element
   * @returns
   */
  getFaceFromVideo(opt, _videoEl, _canvasEl) {
    if (typeof this.timer === "number") {
      console.error("getFaceFromVideo loading...", this.timer);
      return;
    }
    if (_videoEl) {
      this.videoEl = _videoEl;
    }
    if (this._canvasEl) {
      this.canvasEl = _canvasEl;
    }

    return new Promise((resolve, reject) => {
      const { delay = this.delay, size = this.size } = opt || {};

      let detections = null;

      const detectFace = async () => {
        if (detections && detections.length > 0) {
          this._handleDetectRes(detections);
          return;
        }
        console.log("detectFace...");

        try {
          // 获取识别结果
          detections = await this._detectFace();
        } catch (error) {
          reject("Error checkVideo: ", error);
          console.error("Error checkVideo: ", error);
        }

        if (detections && detections.length > 0) {
          this._handleDetectRes(detections);

          console.log("人脸识别成功");

          this.closeDetect();

          // 输出结果图片（人脸截图+人脸标志点）
          const img = this.canvasEl.toDataURL("image/png");

          const res = {
            detections,
            img,
          };

          resolve(res);

          return Promise.resolve(res);
        }
      };

      detectFace();

      this.timer = setInterval(() => {
        detectFace();
      }, delay);
    });
  }

  /**
   * 识别人脸
   */
  async _detectFace() {
    try {
      const { videoEl } = this;
      // 获取识别结果
      let detections = await faceapi
        // 识别人脸
        // detectSingleFace
        // detectAllFaces
        // .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options())
        .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
        // 检测 68 个人脸标志点
        .withFaceLandmarks();
      // 识别面部表情
      // .withFaceExpressions();

      // 结果数据为对象时转为数组
      if (typeof detections === "object" && !Array.isArray(detections)) {
        detections = [detections];
      }
      return Promise.resolve(detections);
    } catch (error) {
      console.error("_detectFace", error);
      return Promise.reject(error);
    }
  }

  _handleDetectRes(detections) {
    const { canvasEl, videoEl } = this;
    if (!detections || detections.length <= 0) {
      console.log("_handleDetectRes detections: ", detections);
      return;
    }
    const { size } = this;
    // 匹配尺寸
    faceapi.matchDimensions(canvasEl, videoEl);

    // 调整检测到的框的大小，以防显示的图像与原始图像的大小不同
    const resizedResult = faceapi.resizeResults(detections, size);

    // 将检测绘制到画布中
    faceapi.draw.drawDetections(canvasEl, resizedResult);

    // 绘制摄像头图片到画布中
    canvasEl.getContext("2d").drawImage(videoEl, 0, 0, size.width, size.height);

    // 绘制人脸识别点位到画布中
    faceapi.draw.drawFaceLandmarks(canvasEl, resizedResult);
  }

  getResImg() {
    return canvasEl.toDataURL("image/png");
  }

  /**
   * 关闭检测
   */
  closeDetect() {
    const { canvasEl } = this;
    clearInterval(this.timer);
    this.timer = null;

    // 输出结果图片（人脸截图+人脸标志点）
    const img = canvasEl.toDataURL("image/png");
    if (img) {
      return img;
    }
    return;
  }

  /**
   * 从视频中获取人脸
   * @param {Object} opt 配置项
   * @param {Element} videoEl video Element
   * @param {Element} canvasEl canvas Element
   * @returns
   */
  async _getFace(opt = {}, _videoEl, _canvasEl) {
    if (_videoEl) {
      this.videoEl = _videoEl;
    }
    if (this._canvasEl) {
      this.canvasEl = _canvasEl;
    }

    const { videoEl, canvasEl } = this;
    const { size = this.size } = opt;

    let detections = null;

    try {
      // 获取识别结果
      detections = await this._detectFace();
    } catch (error) {
      reject("Error checkVideo: ", error);
      console.error("Error checkVideo: ", error);
    }

    if (detections && detections.length > 0) {
      console.log("人脸识别成功");
      this._handleDetectRes(detections);

      this.closeDetect();

      // 输出结果图片（人脸截图+人脸标志点）
      const img = canvasEl.toDataURL("image/png");

      const res = {
        detections,
        img,
        resizedResult,
      };

      resolve(res);

      return Promise.resolve(res);
    }
  }
}

/**
 * 加载训练好的模型
 * @param {Array} customizeModules 自定义加载模型 
 * @param {string} modulePath 模型路径
  // faceRecognitionNet 识别人脸
  // faceLandmark68Net 识别脸部特征用于 mobilenet 算法
  // ssdMobilenetv1 google 开源 AI 算法除库包含分类和线性回归
  // tinyFaceDetector 比 Google 的 mobilenet 更轻量级，速度更快一点
  // faceLandmark68TinyNet 识别脸部特征用于tiny算法
  // faceExpressionNet 识别表情,开心，沮丧，普通
  // ageGenderNet 识别性别和年龄
  // mtcnn  多任务CNN算法，一开浏览器就卡死?
  // tinyYolov2 识别身体轮廓的算法
 * @returns 
 */
export function loadModules(customizeModules, modulePath = "/models") {
  const modules = customizeModules || [
    "faceRecognitionNet",
    "faceLandmark68Net",
    "ssdMobilenetv1",
    "tinyFaceDetector",
    "faceLandmark68TinyNet",
    "faceExpressionNet",
    "mtcnn",
  ];
  return Promise.all(
    modules
      ?.filter((it) => it)
      .map((module) => faceapi.nets[module].loadFromUri(modulePath))
  ).catch((err) => {
    console.error("Error loadModules: ", err);
  });
}

/**
 * 从视频中获取人脸
 * @param {Element} videoEl video Element
 * @param {Element} canvasEl canvas Element
 * @param {Object} opt 配置项
 * @returns
 */
export function getFaceFromVideo(videoEl, canvasEl, opt = {}) {
  return new Promise(function (resolve, reject) {
    const {
      delay = 1000,
      size = {
        width: 300,
        height: 300,
      },
    } = opt;

    let timer = null;
    let detections = null;
    let resizedResult = null;

    detectFace();
    timer = setInterval(() => {
      console.log("timer", timer);
      detectFace();
    }, delay);

    async function detectFace() {
      console.log("detectFace...", detections);
      if (detections && detections.length > 0) {
        handleRes();
        return;
      }

      try {
        // 获取识别结果
        detections = await faceapi
          // 识别人脸
          // detectSingleFace
          // detectAllFaces
          // .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options())
          .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
          // 检测 68 个人脸标志点
          .withFaceLandmarks();
        // 识别面部表情
        // .withFaceExpressions();

        // 结果数据为对象时转为数组
        if (typeof detections === "object" && !Array.isArray(detections)) {
          detections = [detections];
        }
      } catch (error) {
        reject("Error checkVideo: ", error);
        console.error("Error checkVideo: ", error);
      }

      console.log("detections", detections && detections.length);

      if (detections && detections.length > 0) {
        handleRes();
      }
    }

    function handleRes() {
      // 显示绘制结果
      faceapi.matchDimensions(canvasEl, videoEl);

      // resizeResults 调整检测到的框的大小，以防显示的图像与原始图像的大小不同
      resizedResult = faceapi.resizeResults(detections, size);

      // 将检测绘制到画布中
      faceapi.draw.drawDetections(canvasEl, resizedResult);

      // 绘制摄像头图片
      canvasEl
        .getContext("2d")
        .drawImage(videoEl, 0, 0, size.width, size.height);

      const videoImg = canvasEl.toDataURL("image/png");
      videoImg;

      // 绘制人脸识别点位到画布中
      faceapi.draw.drawFaceLandmarks(canvasEl, resizedResult);

      console.log("人脸识别成功", timer);

      clearInterval(timer);
      console.log("clear");

      // 输出结果图片（人脸截图+人脸标志点）
      const img = canvasEl.toDataURL("image/png");

      const res = {
        detections,
        img,
        resizedResult,
      };

      resolve(res);

      return Promise.resolve(res);
    }
  });
}

export default FaceTool;
