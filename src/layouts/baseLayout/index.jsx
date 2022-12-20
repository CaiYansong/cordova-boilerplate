import { history } from "umi";
import { useState } from "react";
import { TabBar } from "antd-mobile";
import { AppOutline, UserOutline } from "antd-mobile-icons";

import "./index.less";

const iconSize = 16;

const tabs = [
  {
    key: "home",
    title: "首页",
    icon: <AppOutline fontSize={iconSize} />,
  },
  {
    key: "mine",
    title: "我的",
    icon: <UserOutline fontSize={iconSize} />,
  },
];

export default function BaseLayout(props) {
  const [activeKey, setActiveKey] = useState(
    history.location.pathname.replace(/^\//, "") || "home",
  );

  const setRouteActive = (value) => {
    setActiveKey(value);
    history.push(`/${value}`);
  };

  return (
    <div className="base-layout">
      <div className="body-wrap">{props.children}</div>
      <TabBar
        className="footer-tab-bar"
        activeKey={activeKey}
        onChange={(value) => setRouteActive(value)}
      >
        {tabs.map((item) => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  );
}
