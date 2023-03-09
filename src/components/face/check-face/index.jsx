import { useImperativeHandle, forwardRef, useState, useRef } from "react";
import { Popup, Toast, Dialog, Mask, SpinLoading } from "antd-mobile";

import DataModel from "hzab-data-model";

import Face from "@/components/face";

import "./index.less";

const dm = new DataModel({
  createApi: "/api/v1/user/face/search_self",
});

function CheckFace(props, parentRef) {
  const { onChecked } = props;

  const faceRef = useRef();
  const [visible, setVisible] = useState(false);
  const [simpleTip, setSimpleTip] = useState("");
  const [loading, setLoading] = useState(false);

  useImperativeHandle(parentRef, () => ({
    show,
    close,
  }));

  function checkLipChange(landmark, preRes) {
    return new Promise((resolve) => {
      faceRef.current.startVideo().then((res) => {
        setSimpleTip("张张嘴");
        const _landmark = res?.data?.landmarks[0];
        if (landmark) {
          let change = 0;
          // 张嘴检测 内嘴唇 1-7 2-6 3-5
          const preLipOuter = [
            landmark?.lipInner[7].y - landmark?.lipInner[1].y,
            landmark?.lipInner[6].y - landmark?.lipInner[2].y,
            landmark?.lipInner[5].y - landmark?.lipInner[3].y,
          ];
          const curLipOuter = [
            _landmark?.lipInner[7].y - _landmark?.lipInner[1].y,
            _landmark?.lipInner[6].y - _landmark?.lipInner[2].y,
            _landmark?.lipInner[5].y - _landmark?.lipInner[3].y,
          ];

          preLipOuter.forEach((it, i) => {
            if (Math.abs(it - curLipOuter[i]) > 4) {
              change += 1;
            }
          });

          if (change >= curLipOuter.length) {
            resolve(preLipOuter[1] > curLipOuter[1] ? res : preRes);
          } else {
            checkLipChange(_landmark, res).then((res) => {
              setSimpleTip("");
              resolve(res);
            });
          }
        } else {
          checkLipChange(_landmark, res).then((res) => {
            resolve(res);
          });
        }
      });
    });
  }

  function show(_resolve, _reject) {
    setVisible(true);
    // 首次加载进来 Face 未加载，使用 forceRender 强制加载解决
    return new Promise((resolve, reject) => {
      if (props.checkLip) {
        checkLipChange().then((res) => {
          checkFaceByRemote(res, _resolve || resolve, _reject || reject);
        });
      } else {
        faceRef.current.startVideo().then((res) => {
          checkFaceByRemote(res, _resolve || resolve, _reject || reject);
        });
      }
    });
  }

  function checkFaceByRemote(res, resolve, reject) {
    onCheckFace(res?.data?.faceImg)
      .then((checkRes) => {
        close();
        resolve(checkRes, res);
      })
      .catch((err) => {
        const option = {
          close,
          retry: () => show(resolve, reject),
        };
        setSimpleTip("");

        if (props.onCheckError) {
          props.onCheckError(err, option);
          return;
        }

        err._option = {
          ...option,
          // 因为 reject 已调用， err 中的 retry 需要有新的 promise
          retry: () =>
            new Promise((suc, fail) => {
              show(suc, fail);
            }),
        };

        if (!props.closeRetryConfirm) {
          const { preAction, centerAction, suffixAction } =
            props.checkErrConf || {};

          const retryAction = {
            key: "retry",
            text: "重试",
            onClick: () => {
              setSimpleTip("");
              show(resolve, reject);
            },
          };
          const cancelAction = {
            key: "cancel",
            text: "退出",
            onClick: () => {
              close();
              reject(err);
            },
          };

          let actions = [[cancelAction, retryAction]];
          if (preAction || centerAction || suffixAction) {
            actions = [];
            if (preAction) {
              actions.push(preAction);
            }
            actions.push(retryAction);
            if (centerAction) {
              actions.push(centerAction);
            }
            actions.push(cancelAction);
            if (suffixAction) {
              actions.push(suffixAction);
            }
          }

          Dialog.show({
            content: (
              <div className="video-permission-tips">
                {err._message || "人脸核验失败，请重试或联系管理员"}
              </div>
            ),
            closeOnAction: true,
            actions,
          });
          return;
        }

        Toast.show({
          icon: "fail",
          content: err._message || "未知错误!",
        });
        close();
        reject(err);
      });
  }

  function onClose() {
    Dialog.confirm({
      title: "确定退出吗？",
      content: "露个脸就能通过",
      confirmText: "退出",
      onConfirm() {
        close();
      },
    });
  }

  function close() {
    setVisible(false);
    faceRef.current.closeVideo();
  }

  function onCheckFace(faceImg) {
    setLoading(true);
    return (props.model || dm)
      .create({
        ...(props.params || {}),
        base64File: faceImg,
      })
      .then((res) => {
        Toast.show({
          icon: "success",
          content: res._message || "核验成功.",
        });
        onChecked && onChecked();
        close();
        setLoading(false);
        return res;
      })
      .catch((err) => {
        // TODO: 确认多次失败逻辑？
        Toast.show({
          icon: "fail",
          content: err._message || "未知错误!",
        });
        setLoading(false);
        return Promise.reject(err);
      });
  }

  return (
    <Popup
      bodyClassName="check-face-popup"
      visible={visible}
      bodyStyle={{ height: "100vh" }}
      // forceRender 解决 show faceRef.current undefined 的问题
      forceRender
      showCloseButton
      onClose={onClose}
    >
      <Face
        ref={faceRef}
        delay={props.checkLip ? 10 : undefined}
        loop={props.checkLip}
        simpleTip={simpleTip}
      />
      <Mask className="check-face-loading-mask" visible={loading}>
        <SpinLoading color="primary" style={{ "--size": "40vw" }} />
      </Mask>
    </Popup>
  );
}

export default forwardRef(CheckFace);
