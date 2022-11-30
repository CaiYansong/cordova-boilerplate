import { Outlet } from "umi";

const LoginLayout = () => {
  console.log('LoginLayout');
  return (
    <div>
      <Outlet />
    </div>
  );
};

export default LoginLayout;
