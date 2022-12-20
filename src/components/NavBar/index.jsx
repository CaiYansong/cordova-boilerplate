import { history } from "umi";
import { NavBar } from "antd-mobile";

import Add from "./add";
import * as navBarConfig from "./config";

import "./index.less";

function onBack() {
  history.go(-1);
}

function NavBarCom({ title, rightNode, backNode }) {
  return (
    <NavBar
      className="nav-bar"
      style={{ height: navBarConfig.navBarHeight }}
      back={backNode}
      right={rightNode}
      onBack={onBack}
    >
      {title}
    </NavBar>
  );
}

export default NavBarCom;

export { Add, navBarConfig };
