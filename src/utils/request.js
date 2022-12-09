function request(url, data, options = {}) {
  const _url = new URL(window.location.origin + "/api/gather/list");

  let _method = options.method || "GET";
  if (_method.toLowerCase() === "get" && data) {
    _url.search = new URLSearchParams(data).toString();
  }

  const _options = {
    ...options,
    method: _method,
  };
  if (_method.toLowerCase() !== "get" && typeof data === "object") {
    _options.body = data && JSON.stringify(data);
  }
  return fetch(_url, _options).then((res) => res.json());
}

class requestC {}

export default request;
