import { useState } from "react";
import { Button } from "antd-mobile";

const HomePage = () => {
  const [msg, setMsg] = useState("");

  const [img, setImg] = useState("");
  const [location, setLocation] = useState("");

  function onGetPic() {
    console.log("onGetPic", navigator.camera);
    if (!navigator.camera) {
      return;
    }
    navigator.camera.getPicture(
      (data) => {
        console.log("data", data);
        setMsg("onGetPic data: " + JSON.stringify(data));
        setImg("data:image/jpeg;base64," + data);
      },
      (err) => {
        console.log("err", err);
        setMsg("onGetPic Error: " + JSON.stringify(err));
      },
      {
        // quality : 存储图像的质量，范围是[0,100]
        // quality: 50,
        // 结果类型
        destinationType: Camera.DestinationType.DATA_URL,
      }
    );
  }

  // cordova-plugin-geolocation
  function onLocation() {
    console.log("onLocation", navigator.geolocation);
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (data) => {
        console.log("data", data.coords);
        const {
          accuracy,
          altitude,
          altitudeAccuracy,
          heading,
          latitude,
          longitude,
          speed,
        } = data.coords;
        setMsg(
          "onLocation data.coords: " +
            JSON.stringify({
              accuracy,
              altitude,
              altitudeAccuracy,
              heading,
              latitude,
              longitude,
              speed,
            })
        );
        // setLocation(data.coords);
      },
      (err) => {
        console.log("err", err);
        setMsg("onLocation Error: " + JSON.stringify(err));
      }
    );
  }

  return (
    <div>
      <p>HomePage.</p>
      <Button>button</Button>
      <div>
        <Button onClick={onLocation}>onLocation</Button>
        <Button onClick={onGetPic}>onGetPic</Button>
      </div>
      <div>
        <img src={img} alt="" />
      </div>
      <div>{location}</div>
      <br />
      <div>{msg}</div>
    </div>
  );
};

export default HomePage;
