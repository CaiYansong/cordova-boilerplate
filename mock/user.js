/*
// 列表
// 入参
{
  pageSize: 10,
  pageNumber: 1,
}
// 出参
{
  code: 200,
  data: {
    list,
    pagination: {
      total: 10
    }
  },
  msg: "获取成功",
}
// Options
{
  code: 200,
  data: {
    list,
  },
  msg: "获取成功",
}

// 数据项
{
  code: 200,
  data: data,
  msg: "成功"
}

{
  code: 400,
  data: data,
  msg: "错误"
}
{
  code: 401,
  data: data,
  msg: "token 失效"
}
*/

function getList(req, res, getItem) {
  console.log("getItem", getItem);
  const { pageSize, pageNumber } = req.query;
  const total = 26;
  const list = [];
  for (let i = 0; i < pageSize; i++) {
    const id = +pageNumber + +pageSize * (+pageNumber - 1) + i;
    const item = (getItem && getItem(id, i)) || {
      id: Date.now() + id,
      name: "name" + id,
    };
    list.push(item);
  }

  const str = JSON.stringify({
    code: 200,
    data: {
      list: list,
      pagination: {
        total,
      },
    },
    msg: "返回成功",
  });

  res.end(str);
}

function getDict(req, res, getItem) {
  const list = [];
  for (let i = 0; i < 26; i++) {
    const item = (getItem && getItem(i)) || {
      label: "label" + i,
      value: "value" + i,
    };
    list.push(item);
  }

  const str = JSON.stringify({
    code: 200,
    data: list,
    msg: "返回成功",
  });

  res.end(str);
}

export default {
  "GET /api/user/list": (req, res) => {
    getList(req, res, (id, i) => {
      return {
        id: Date.now() + id,
        name: "name" + id,
        createAt: Date.now(),
        completedAt: Date.now(),
        taskType: Math.random() * 10 > 5 ? "created" : "send",
        type:
          Math.random() * 10 > 5
            ? "domicile"
            : Math.random() * 10 > 5
            ? "scene"
            : "path",
        status: Math.random() * 10 > 5,
      };
    });
  },
  "GET /api/user/siteType": (req, res) => {
    getDict(req, res);
  },
  "GET /api/user/jurisdiction": (req, res) => {
    getDict(req, res);
  },
  // "POST /api/user/list": (req, res) => {
  //   // 添加跨域请求头
  //   res.setHeader("Access-Control-Allow-Origin", "*");
  //   res.end("ok");
  // },
};
