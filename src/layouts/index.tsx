import { SafeArea } from "antd-mobile";

export default function Layout(props: any) {
  return (
    <div>
      <SafeArea position="top" />
      {props.children}
      <SafeArea position="bottom" />
    </div>
  );
}
