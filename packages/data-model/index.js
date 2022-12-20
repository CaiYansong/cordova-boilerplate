import _ from "lodash";
import axios from "axios";

class DataModel {
  constructor(params) {
    const {
      ctx,
      query,
      createApi,
      createMap,
      getApi,
      getMap,
      getListApi,
      getListMap,
      getListFunc,
      updateApi,
      updateMap,
      deleteApi,
      multipleDeleteApi,
      axios: as,
      axiosConf,
    } = params;

    this.ctx = ctx || {};
    this.query = query || {};
    this.axios = as || axios;
    this.axiosConf = axiosConf || {};

    this.createApi = createApi;
    this.createMap = createMap;
    this.getApi = getApi;
    this.getMap = getMap;
    this.getListApi = getListApi;
    this.getListMap = getListMap;
    this.getListFunc = getListFunc;
    this.updateApi = updateApi;
    this.updateMap = updateMap;
    this.deleteApi = deleteApi;
    this.multipleDeleteApi = multipleDeleteApi;
  }

  getApiUrl(api, record, ctx = this.ctx) {
    if (!api) {
      throw new Error("Error getApiUrl api 不能为空", api, record, ctx);
    }
    let apiUrl = api;
    const params = _.merge({}, record, ctx);
    _.each(params, (value, key) => {
      if (!_.isString(value) || !_.isNumber(value) || _.isBoolean(value)) {
        apiUrl = apiUrl.replace(`:${key}`, value);
      }
    });
    return apiUrl;
  }

  get(q = {}, ctx = {}) {
    let query = _.merge({}, this.query, q);
    query = _.pickBy(query, (val) => !_.isNil(val) && val !== "");

    return new Promise((resolve, reject) => {
      const apiUrl = this.getApiUrl(this.getApi, query, ctx);
      this.axios
        .get(apiUrl, {
          ...this.axiosConf,
          params: query,
        })
        .then((response) => {
          this.handleRes(
            response,
            (res) => {
              if (this.getMap) {
                res = this.getMap(res);
              }
              resolve(res);
            },
            reject,
          );
        })
        .catch((err) => this.errorHandler(err, reject));
    });
  }

  async getList(q, ctx) {
    let query = _.merge({}, this.query, q);
    query = _.pickBy(query, (val) => !_.isNil(val) && val !== "");

    let resultList = null;
    if (this.getListFunc) {
      resultList = await this.getListFunc(query);
    } else {
      const getPro = new Promise((resolve, reject) => {
        const apiUrl = this.getApiUrl(this.getListApi, q, ctx);
        this.axios
          .get(apiUrl, {
            ...this.axiosConf,
            params: query,
          })
          .then((response) => {
            this.handleRes(
              response,
              (res) => {
                // data: { list: [], pagination: { current: 0, total: 1 } }
                if (this.getListMap) {
                  res.list = res.list.map((record) => this.getListMap(record));
                }
                resolve(res);
              },
              reject,
            );
          })
          .catch((err) => this.errorHandler(err, reject));
      });
      resultList = await getPro;
    }
    return resultList;
  }

  create(params, ctx) {
    return new Promise((resolve, reject) => {
      const apiUrl = this.getApiUrl(this.createApi, params, ctx);
      const opt = { ...this.axiosConf };
      if (params instanceof FormData) {
        opt.headers = { "Content-Type": "multipart/form-data" };
      }
      this.axios
        .post(apiUrl, params, opt)
        .then((response) => {
          this.handleRes(response, resolve, reject);
        })
        .catch((err) => this.errorHandler(err, reject));
    });
  }

  update(params, ctx) {
    return new Promise((resolve, reject) => {
      const apiUrl = this.getApiUrl(this.updateApi, params, ctx);
      const opt = { ...this.axiosConf };
      if (params instanceof FormData) {
        opt.headers = { "Content-Type": "multipart/form-data" };
      }
      this.axios
        .put(apiUrl, params, opt)
        .then((response) => {
          this.handleRes(response, resolve, reject);
        })
        .catch((err) => this.errorHandler(err, reject));
    });
  }

  delete(params, ctx) {
    return new Promise((resolve, reject) => {
      const apiUrl = this.getApiUrl(this.deleteApi, params, ctx);
      this.axios
        .delete(apiUrl, { ...this.axiosConf, ...params })
        .then((response) => {
          this.handleRes(response, resolve, reject);
        })
        .catch((err) => this.errorHandler(err, reject));
    });
  }

  multipleDelete(params, ctx) {
    return new Promise((resolve, reject) => {
      const apiUrl = this.getApiUrl(this.multipleDeleteApi, params, ctx);
      this.axios
        .delete(apiUrl, { ...this.axiosConf, ...params })
        .then((response) => {
          this.handleRes(response, resolve, reject);
        })
        .catch((err) => this.errorHandler(err, reject));
    });
  }

  handleRes(response, resolve, reject) {
    if (typeof response !== "object") {
      reject(new Error("response not object"));
      return;
    }
    const {
      data: { code, message, data, msg },
    } = response;
    if (code === 200) {
      if (data && _.isObject(data) && data.message === undefined) {
        // 前缀 _ 避免与 data 里已有的 message 冲突
        data._message = message || msg;
      }
      resolve(data);
    } else {
      const error = new Error(message || msg);
      error.code = code;
      error.response = response;
      error._message = message || msg;
      reject(error);
    }
  }

  errorHandler(err, reject) {
    const response = err.response || err;
    if (response) {
      const message =
        (response.data && (response.data.message || response.data.msg)) ||
        response.msg;
      const error = new Error(message || response.statusText || "未知错误");
      error.code = response.status;
      error.response = response;
      if (message) {
        // 前缀 _ 避免与 data 里已有的 message 冲突
        error._message = message;
      }
      return reject(error);
    }
    return reject(err);
  }
}

export default DataModel;
