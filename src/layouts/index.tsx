import { Outlet, history } from "umi";
import { useState, useEffect } from "react";
import { SafeArea, TabBar } from "antd-mobile";
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
    icon: (active: boolean) => (active ? <MessageFill /> : <MessageOutline />),
  },
  {
    key: "mine",
    title: "我的",
    icon: <UserOutline />,
  },
];

export default function Layout() {
  console.log("Layout");

  useEffect(() => {
    // getAllPermissions();
  }, []);

  const [activeKey, setActiveKey] = useState("todo");

  const setRouteActive = (value: string) => {
    history.push(value);
  };

  return (
    <div>
      <SafeArea position="top" />
      <Outlet />
      <SafeArea position="bottom" />
    </div>
  );
}
