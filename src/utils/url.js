export function getUrlParam(key, url) {
  const _url = new URL(url || window.location.href);
  return _url?.searchParams?.get(key);
}
