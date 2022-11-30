import { Outlet } from "umi";
import { useEffect } from "react";
import { SafeArea } from "antd-mobile";


export default function Layout() {
  console.log("Layout");

  useEffect(() => {
  }, []);

  return (
    <div>
      <SafeArea position="top" />
      <Outlet />
      <SafeArea position="bottom" />
    </div>
  );
}
