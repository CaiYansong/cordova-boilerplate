import { useState, useRef, useEffect } from "react";
import { Button } from "antd-mobile";

import FaceTool from "./face-utils";

const SIZE = {
  width: 300,
  height: 300,
};

let media = null;

let faceTool = null;

export default function Face() {
  const canvasRef = useRef();
  const videoRef = useRef();

  const [modulesLoading, setModulesLoading] = useState(true);
  const [faceLoading, setFaceLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 开启摄像头获取视频
  const startVideo = () => {
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
    if (faceLoading) {
      console.log("faceLoading", faceLoading);
      return;
    }
    setFaceLoading(true);
    faceTool.getFaceFromVideo().then(() => {
      setFaceLoading(false);
      closeVideo();
    });
  };

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
    // loadModel();
    faceTool = new FaceTool({
      videoEl: videoRef.current,
      canvasEl: canvasRef.current,
    });
    log("模型加载中...");
    faceTool.loadModules().then(() => {
      console.log("---------- 模型加载完毕 ----------");
      log("模型加载完毕");
      setModulesLoading(false);
    });
    // 视频开始播放才进行检测
    videoRef.current.addEventListener("playing", function () {
      checkVideo();
    });
  }, []);

  return (
    <div>
      <p>{msg}</p>
      <div>
        <Button disabled={modulesLoading || faceLoading} onClick={onGetFace}>
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
