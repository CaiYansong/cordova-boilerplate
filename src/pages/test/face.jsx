import { useState, useRef, useEffect } from "react";
import { Button } from "antd-mobile";

import FaceTool from "./face-utils";
import UserMedia from "./video-utils";

const SIZE = {
  width: 300,
  height: 300,
};

let faceTool = null;

const userMedia = new UserMedia({ video: SIZE });

export default function Face() {
  const canvasRef = useRef();
  const videoRef = useRef();

  const [modulesLoading, setModulesLoading] = useState(true);
  const [faceLoading, setFaceLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 开启摄像头获取视频
  const startVideo = () => {
    userMedia.getUserMedia().then(function handleVideo(stream) {
      log("handleVideo");
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    });
  };

  // 关闭摄像头
  const closeVideo = () => {
    userMedia.closeUserMedia();
  };

  // 检测人脸
  const checkVideo = async () => {
    if (faceLoading) {
      console.log("faceLoading", faceLoading);
      return;
    }
    console.log("checkVideo");
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
    // 使用 onplaying 解决 addEventListener 本地开发多次触发的问题
    videoRef.current.onplaying = function () {
      console.log('onPlaying ');
      checkVideo();
    };
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
