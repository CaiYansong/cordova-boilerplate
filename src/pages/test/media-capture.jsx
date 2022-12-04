import { useState, useEffect } from "react";

/*
// 文件转为 input file 格式
navigator.camera.getPicture(
  function (imgData) {
    var fd = new FormData();
    var reader;
    var imgBlob;
    window.resolveLocalFileSystemURL(
      imgData,
      function (fileEntry) {
        fileEntry.file(
          function (file) {
            reader = new FileReader();
            reader.onloadend = function (e) {
              imgBlob = new Blob([this.result], { type: "image/jpeg" });
              window.__file = imgBlob; // PLACE THE FILE ASSIGNMENT HERE AFTER THE READER HAS INGESTED THE FILE BYTES
            };
            reader.readAsArrayBuffer(file);
            // window.__file = imgBlob; // FILE ASSIGNMENT USED TO BE HERE
          },
          function (e) {
            console.log("error with photo file");
          }
        );
      },
      function (e) {
        console.log("error with photo file");
      }
    );
  },
  function () {
    alert("Error taking picture", "Error");
  },
  options
);
*/

function MediaCapture() {
  useEffect(() => {
    console.log("navigator.device.capture", navigator.device.capture);
  }, []);

  const [img, setImg] = useState();
  const [video, setVideo] = useState();
  const [localVideo, setLocalVideo] = useState();
  const [videoName, setVideoName] = useState();

  function onCaptureImg(params) {
    console.log("onCaptureImg");
    navigator.device?.capture.captureImage(
      function (mediaFiles) {
        setImg(mediaFiles[0].localURL);
        console.log("captureImage", mediaFiles);
      },
      function (err) {
        console.log("captureImage err", err);
      },
      {}
    );
  }
  function onCaptureVideo(params) {
    console.log("onCaptureVideo");
    navigator.device?.capture.captureVideo(
      function (mediaFiles) {
        const { localURL, fullPath, name } = mediaFiles[0];
        setVideo(localURL);
        setLocalVideo(fullPath);
        setVideoName(name);
        console.log("captureVideo", mediaFiles);
      },
      function (err) {
        console.log("captureVideo err", err);
      },
      {}
    );
  }

  function uploadCaptureVideo() {
    // https://cordova.apache.org/blog/2017/10/18/from-filetransfer-to-xhr2.html
    if (!localVideo) {
      return;
    }
    window.requestFileSystem(
      LocalFileSystem.PERSISTENT,
      0,
      function (fs) {
        console.log("file system open: " + fs.name, localVideo, video);
        resolveLocalFileSystemURL(video, function (fileEntry) {
          console.log("fileEntry", fileEntry);
          fileEntry.file(
            function (file) {
              var reader = new FileReader();
              reader.onloadend = function () {
                // Create a blob based on the FileReader "result", which we asked to be retrieved as an ArrayBuffer
                var blob = new Blob([new Uint8Array(this.result)], {
                  type: "mp4",
                });
                console.log("blob", blob);
              };
              // Read the file as an ArrayBuffer
              reader.readAsArrayBuffer(file);
            },
            function (err) {
              console.error("error getting fileentry file!" + err);
            }
          );
        });
        fs.root.getFile(
          videoName,
          { create: true, exclusive: false },
          function (fileEntry) {
            console.log("fileEntry", fileEntry);
          },
          function (err) {
            console.error("error getting file! " + JSON.stringify(err));
          }
        );
        fs.root.getFile(
          videoName,
          { create: true, exclusive: false },
          function (fileEntry) {
            console.log("fileEntry", fileEntry);
          },
          function (err) {
            console.error("error getting file! " + JSON.stringify(err));
          }
        );
        return;
        fs.root.getFile(
          videoName,
          { create: true, exclusive: false },
          function (fileEntry) {
            console.log("fileEntry", fileEntry);
            return;
            fileEntry.file(
              function (file) {
                var reader = new FileReader();
                reader.onloadend = function () {
                  // Create a blob based on the FileReader "result", which we asked to be retrieved as an ArrayBuffer
                  var blob = new Blob([new Uint8Array(this.result)], {
                    type: "image/png",
                  });
                  console.log("blob", blob);
                };
                // Read the file as an ArrayBuffer
                reader.readAsArrayBuffer(file);
              },
              function (err) {
                console.error("error getting fileentry file!" + err);
              }
            );
          },
          function (err) {
            console.error("error getting file! " + JSON.stringify(err));
          }
        );
      },
      function (err) {
        console.error("error getting persistent fs! " + err);
      }
    );
  }

  return (
    <div>
      <button onClick={onCaptureImg}>onCaptureImg</button>
      <br />
      {img && <img src={img} style={{ height: "200px" }} />}
      <br />
      <button onClick={onCaptureVideo}>onCaptureVideo</button>
      <button onClick={uploadCaptureVideo}>uploadCaptureVideo</button>
      <br />
      {/* {video && <video src={video} style={{ height: "200px" }} controls />} */}
    </div>
  );
}

export default MediaCapture;
