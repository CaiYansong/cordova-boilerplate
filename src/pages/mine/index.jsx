import { Link, Outlet } from "umi";

const MinePage = () => {
  return (
    <div>
      <p>Mine.</p>
      <div>
        <Link to="/login">登录</Link>
      </div>
    </div>
  );
};

export default MinePage;
