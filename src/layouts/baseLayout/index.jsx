import { Outlet, history } from "umi";
import { useState, useEffect } from "react";
import { TabBar } from "antd-mobile";
import {
  AppOutline,
  MessageOutline,
  MessageFill,
  UnorderedListOutline,
  UserOutline,
} from "antd-mobile-icons";

import { getAllPermissions } from "@service/permission";

import styles from "./index.less";

const tabs = [
  {
    key: "home",
    title: "首页",
    icon: <AppOutline />,
  },
  {
    key: "todo",
    title: "待办",
    icon: <UnorderedListOutline />,
  },
  {
    key: "message",
    title: "消息",
    icon: (active) => (active ? <MessageFill /> : <MessageOutline />),
  },
  {
    key: "mine",
    title: "我的",
    icon: <UserOutline />,
  },
];

export default function FooterBarLayout() {
  console.log("Layout");

  useEffect(() => {
    getAllPermissions();
  }, []);

  const [activeKey, setActiveKey] = useState(
    history.location.pathname.replace(/^\//, "") || "home"
  );

  const setRouteActive = (value) => {
    setActiveKey(value);
    history.push(value);
  };

  return (
    <div className={styles.layoutWarp}>
      <div className={styles.bodyWrap}>
        <Outlet />
      </div>
      <TabBar
        activeKey={activeKey}
        className={styles.footerBar}
        onChange={(value) => setRouteActive(value)}
      >
        {tabs.map((item) => (
          <TabBar.Item key={item.key} icon={item.icon} />
        ))}
      </TabBar>
    </div>
  );
}
