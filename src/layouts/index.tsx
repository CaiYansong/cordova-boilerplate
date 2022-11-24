import { useEffect } from "react";
import { Link, Outlet } from "umi";
import styles from "./index.less";
import { getAllPermissions } from "@service/permission";

export default function Layout() {
  useEffect(() => {
    getAllPermissions();
  }, []);

  return (
    <div className={styles.navs}>
      <ul>
        <li>
          <Link to="/">Index</Link>
        </li>
        <li>
          <Link to="/home">Home</Link>
        </li>
        <li>
          <Link to="/docs">Docs</Link>
        </li>
        <li>
          <a href="https://github.com/umijs/umi">Github</a>
        </li>
      </ul>
      <Outlet />
    </div>
  );
}
