import { Outlet } from "umi";
import { useEffect } from "react";
import { SafeArea } from "antd-mobile";

import { getAllPermissions } from "@service/permission";

export default function Layout() {
  console.log("Layout");

  useEffect(() => {
    // getAllPermissions();
  }, []);

  return (
    <div>
      <SafeArea position="top" />
      <Outlet />
      <SafeArea position="bottom" />
    </div>
  );
}
