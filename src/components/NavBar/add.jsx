import { history } from "umi";
import { AddOutline } from "antd-mobile-icons";

function Add(props) {
  function onClick(...args) {
    if (props.onClick) {
      props.onClick(...args);
    } else if (props.path) {
      const { path, query } = props;
      let opt = path;
      if (query) {
        opt = {
          pathname: path,
          query: query,
        };
      }
      history.push(opt);
    }
  }
  return <AddOutline fontSize={14} onClick={onClick} />;
}

export default Add;
