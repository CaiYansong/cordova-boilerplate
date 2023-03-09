import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { SpinLoading, Dialog } from "antd-mobile";

import FaceTool from "./common/face-utils";
import UserMedia from "./common/video-utils";

import "./index.less";

const videoSize = 65;

let width = document.body.clientWidth * (videoSize / 100);

const SIZE = {
  width: width,
  height: width,
};

let faceTool = null;

const userMedia = new UserMedia({ video: SIZE });

// 人脸检测
function FaceDetect(props, parentRef) {
  const { onGetFace, auto, title = "人脸核验" } = props;

  useImperativeHandle(parentRef, () => ({
    startVideo,
    closeVideo,
  }));

  const canvasRef = useRef();
  const videoRef = useRef();

  const [playing, setPlaying] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [faceLoading, setFaceLoading] = useState(false);

  // 开启摄像头获取视频
  function startVideo() {
    return new Promise((resolve, reject) => {
      if (faceLoading) {
        reject("已有程序处于执行状态.");
        return;
      }
      if (playing) {
        checkVideo().then((res) => {
          resolve(res);
        });
        return;
      }
      // 视频开始播放才进行检测
      // 使用 onplaying 解决 addEventListener 本地开发多次触发的问题
      videoRef.current.onplaying = function () {
        setPlaying(true);
        checkVideo().then((res) => {
          resolve(res);
        });
      };
      userMedia
        .getUserMedia()
        .then(function handleVideo(stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        })
        .catch((err) => {
          if (err.message === "Permission denied") {
            Dialog.alert({
              content: (
                <div className="video-permission-tips">
                  请确认摄像头权限是否开启！
                </div>
              ),
            });
          }
        });
    });
  }

  // 关闭摄像头
  function closeVideo() {
    userMedia.closeUserMedia();
    setPlaying(false);
    faceTool.closeDetect();
    setFaceLoading(false);
  }

  // 检测人脸
  function checkVideo() {
    return new Promise((resolve, reject) => {
      if (faceLoading) {
        reject("已有程序处于执行状态.");
        return;
      }
      setFaceLoading(true);
      faceTool
        // 使用最新的 video & canvas DOM
        .getFaceFromVideo({}, videoRef.current, canvasRef.current)
        .then((res) => {
          setFaceLoading(false);
          resolve(res);
          onGetFace &&
            onGetFace(res)
              ?.then(() => {
                closeVideo();
              })
              .catch((err) => {
                checkVideo();
              });
        });
    });
  }

  useEffect(() => {
    faceTool = new FaceTool({
      videoEl: videoRef.current,
      canvasEl: canvasRef.current,
      size: SIZE,
      config: {
        showDetections: false,
        showLandmarks: false,
        tinyOptions: {
          inputSize: 128,
          scoreThreshold: 0.8,
        },
      },
      firstDelay: props.loop ? props.delay : undefined,
      delay: props.delay,
    });
    faceTool.loadModules().then(() => {
      setModulesLoading(false);
    });

    // 自动开始检测
    auto && startVideo();

    return () => {
      closeVideo();
    };
  }, []);

  return (
    <div className="face-detect-wrap">
      <div className="face-detect-tips">
        <div className="title">{title}</div>
        <div className="tip">请保持光鲜充足，并正对摄像头</div>
      </div>
      <div
        className="face-detect-view"
        style={{
          width: `${videoSize}vw`,
          height: `${videoSize}vw`,
        }}
      >
        <video
          ref={videoRef}
          className="face-detect-video"
          style={{
            display: playing ? "unset" : "none",
            width: `${videoSize}vw`,
            height: `${videoSize}vw`,
          }}
          width={width}
          height={width}
          playsInline
          muted
          autoPlay
        ></video>
        <canvas
          ref={canvasRef}
          className="face-detect-canvas"
          style={{
            width: `${videoSize}vw`,
            height: `${videoSize}vw`,
          }}
          width={width}
          height={width}
        />
        {faceLoading ? (
          <SpinLoading className="face-loading" color="#69b1ff" />
        ) : null}
        {props.simpleTip ? (
          <div className="simple-tip">{props.simpleTip}</div>
        ) : null}
      </div>
      {props.simpleTip ? (
        <div className="simple-tip-large">{props.simpleTip}</div>
      ) : null}
      {modulesLoading ? (
        <div className="module-loading-wrap">
          <SpinLoading className="module-loading" color="primary" />
        </div>
      ) : null}
    </div>
  );
}

export default forwardRef(FaceDetect);
