/*
// constraints 参数可参考：https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices/getUserMedia
// examples
function testGetUserMedia() {
  const constraints = {
    video: {
      width: 300,
      height: 300,
    },
  };
  getUserMedia(constraints).then(function (stream) {
    media = stream;
    videoEl.srcObject = stream;
    videoEl.play();
  });
}
*/

export class UserMedia {
  constructor(constraints) {
    this.getMediaDevices = getMediaDevices;

    this.constraints = constraints || { video: true };

    this.mediaDevices = this.getMediaDevices();

    this.media = null;
  }

  /**
   * 兼容版 navigator.mediaDevices.getUserMedia
   * @param {Object} constraints
   * @returns
   */
  getUserMedia(constraints = this.constraints) {
    const { mediaDevices } = this;
    if (!mediaDevices || !mediaDevices.getUserMedia) {
      console.warn("mediaDevices.getUserMedia is undefined");
      return;
    }
    return mediaDevices.getUserMedia(constraints).then((stream) => {
      this.media = stream;
      return stream;
    });
  }

  /**
   * 关闭媒体流
   */
  closeUserMedia() {
    const { media } = this;
    if (media?.active == true) {
      const track = media.getTracks()[0];
      track.stop();
      this.media = null;
    }
  }
}

/**
 * 获取媒体设备接口
 * getUserMedia:
 * navigator.mediaDevices?.getUserMedia
 * navigator.getUserMedia
 * navigator.webkitGetUserMedia
 * navigator.mozGetUserMedia
 * navigator.msGetUserMedia
 * navigator.oGetUserMedia
 * window.MediaDevices
 * @returns
 */
export function getMediaDevices() {
  const mediaDevices = navigator.mediaDevices || {};
  if (mediaDevices?.getUserMedia === undefined) {
    // 兼容性写法
    const getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia ||
      navigator.oGetUserMedia ||
      window.MediaDevices;
    if (getUserMedia) {
      mediaDevices.getUserMedia = function (constraints) {
        return new Promise(function (resolve, reject) {
          getUserMedia.call(mediaDevices, constraints, resolve, reject);
        });
      };
    } else {
      console.error("not getUserMedia");
    }
  }
  return mediaDevices;
}

export default UserMedia;
