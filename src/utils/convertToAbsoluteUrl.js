import checkTypeUrl from './checkTypeUrl.js';

function convertToAbsoluteUrl(src, baseUrl) {
  if (checkTypeUrl(src)) {
    return src;
  }
  return new URL(src, baseUrl).href;
}

export default convertToAbsoluteUrl;
