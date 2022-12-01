import { useState, useRef, useEffect } from "react";
import { Button } from "antd-mobile";
import * as faceapi from "face-api.js";

const SIZE = {
  width: 300,
  height: 300,
};

let media = null;

export default function Face() {
  const canvasRef = useRef();
  const videoRef = useRef();

  const [modulesLoading, setModulesLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // 开启摄像头获取视频
  const startVideo = () => {
    log("startVideo", navigator.getUserMedia, navigator.mediaDevices);
    // 以下是此方法的兼容性写法，
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }
    if (navigator?.mediaDevices?.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        var getUserMedia =
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia ||
          navigator.oGetUserMedia ||
          window.MediaDevices;
        if (!getUserMedia) {
          console.error("not getUserMedia");
          return Promise.reject(
            new Error("getUserMedia is not implemented in this browser")
          );
        }
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }

    const videoConfig = { video: { ...SIZE } };
    if (navigator.getUserMedia) {
      log("navigator.getUserMedia");
      navigator.getUserMedia(videoConfig, handleVideo, (err) =>
        console.error(err)
      );
    } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      log("navigator.mediaDevices.getUserMedia");
      navigator.mediaDevices.getUserMedia(videoConfig).then(handleVideo);
    }

    function handleVideo(stream) {
      log("handleVideo");
      media = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      // 视频开始播放才进行检测
      videoRef.current.addEventListener("playing", function () {
        checkVideo();
      });
    }
  };

  // 关闭摄像头
  const closeVideo = () => {
    if (media == null) {
      return;
    }
    if (media.active == true) {
      let track = media.getTracks()[0];
      track.stop();
    }
  };

  // 检测人脸
  const checkVideo = async () => {
    let timer = null;
    let detections = null;
    detectFace();

    async function detectFace() {
      log("识别中...");

      try {
        // 获取识别结果
        detections = await faceapi
          // 识别所以的人脸
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          // 检测 68 个人脸标志点
          .withFaceLandmarks(true)
          // 识别面部表情
          .withFaceExpressions();

        // resizeResults 调整检测到的框的大小，以防显示的图像与原始图像的大小不同
        detections = faceapi.resizeResults(detections, {
          ...SIZE,
        });
      } catch (error) {
        console.error(error);
        log("Error", JSON.stringify(error));
      }

      // 显示绘制结果
      faceapi.matchDimensions(canvasRef.current, videoRef.current);

      // 绘制摄像头图片
      canvasRef.current
        .getContext("2d")
        .drawImage(videoRef.current, 0, 0, SIZE.width, SIZE.height);

      // 绘制人脸识别结果
      faceapi.draw.drawFaceLandmarks(canvasRef.current, detections);

      // 输出结果图片（人脸截图+人脸标志点）
      const img = canvasRef.current.toDataURL("image/png");
      console.log("result img: ", img);

      // canvasRef.getContext('2d').clearRect(0, 0, canvasRef.width, canvasRef.height)
      // faceapi.draw.drawDetections(canvasRef, detections)
      // faceapi.draw.drawFaceExpressions(canvasRef, detections)
      // detections.forEach(({ detection, descriptor }) => {
      //   const drawBox = new faceapi.draw.DrawBox(detection.box, { label: "" });
      //   drawBox.draw(canvasRef.current);
      // });

      if (detections && detections.length > 0) {
        clearInterval(timer);
        log("人脸识别成功");

        timer = null;

        return Promise.resolve(detections);
      }
      // 无结果递归获取
      if (!detections || detections.length <= 0) {
        detectFace();
      }
    }
  };

  function loadModel() {
    var basePath = location.origin + "/models";

    // var basePath = "./" + "models";

    // 加载训练好的模型
    // faceRecognitionNet 识别人脸
    // faceLandmark68Net 识别脸部特征用于 mobilenet 算法
    // ssdMobilenetv1 google 开源 AI 算法除库包含分类和线性回归
    // tinyFaceDetector 比 Google 的 mobilenet 更轻量级，速度更快一点
    // faceLandmark68TinyNet 识别脸部特征用于tiny算法
    // faceExpressionNet 识别表情,开心，沮丧，普通
    // ageGenderNet 识别性别和年龄
    // mtcnn  多任务CNN算法，一开浏览器就卡死?
    // tinyYolov2 识别身体轮廓的算法
    setModulesLoading(true);
    log("模型加载中...");
    Promise.all([
      faceapi.nets.faceRecognitionNet.loadFromUri(basePath),
      faceapi.nets.faceLandmark68Net.loadFromUri(basePath),
      faceapi.nets.ssdMobilenetv1.loadFromUri(basePath),
      faceapi.nets.tinyFaceDetector.loadFromUri(basePath),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(basePath),
      faceapi.nets.mtcnn.loadFromUri(basePath),
      faceapi.nets.faceExpressionNet.loadFromUri(basePath),
    ]).then(() => {
      console.log("---------- 模型加载完毕 ----------");
      log("模型加载完毕");
      setModulesLoading(false);
      // startVideo();
    });
  }

  function log(...args) {
    console.log(...args);
    setMsg(args.join(", "));
  }

  function onGetFace() {
    log("onGetFace 开始识别");
    startVideo();
  }
  function onCloseFace() {
    log("onCloseFace 结束识别");
    closeVideo();
  }

  useEffect(() => {
    loadModel();
  }, []);

  return (
    <div>
      <p>{msg}</p>
      <div>
        <Button disabled={modulesLoading} onClick={onGetFace}>
          开始检测
        </Button>
        <Button disabled={modulesLoading} onClick={onCloseFace}>
          结束检测
        </Button>
      </div>
      <video
        playsInline
        muted
        autoPlay
        ref={videoRef}
        width={250}
        height={250}
        className="Videoverify"
      >
        {" "}
      </video>
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        className="Canvasverify"
      />
    </div>
  );
}
