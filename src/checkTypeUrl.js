function checkTypeUrl(url) {
  const pattern = /^(https?:\/\/|ftp:\/\/|file:\/\/|data:\/\/)/;
  return pattern.test(url);
}

export default checkTypeUrl;
