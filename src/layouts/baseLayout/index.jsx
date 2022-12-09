import { history } from "umi";
import { useState } from "react";
import { TabBar } from "antd-mobile";
import {
  AppOutline,
  MessageOutline,
  MessageFill,
  UnorderedListOutline,
  UserOutline,
} from "antd-mobile-icons";

import styles from "./index.less";

const tabs = [
  {
    key: "home",
    title: "首页",
    icon: <AppOutline />,
  },
  {
    key: "mine",
    title: "我的",
    icon: <UserOutline />,
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
    <div className={styles.layoutWarp}>
      <div className={styles.bodyWrap}>{props.children}</div>
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
