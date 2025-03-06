import convertToAbsoluteUrl from './convertToAbsoluteUrl.js';

function extractLocalResources($, baseUrl) {
  const selectors = {
    img: 'src',
    link: 'href',
    script: 'src',
  };

  return Object.entries(selectors).flatMap(([tag, attr]) => $(tag)
    .map((_, el) => $(el).attr(attr))
    .get()
    .filter((src) => src && new URL(src, baseUrl).origin === baseUrl)
    .map((src) => ({
      tag,
      attr,
      srcBase: src,
      absolutPathInHTML: convertToAbsoluteUrl(src, baseUrl),
    })));
}

export default extractLocalResources;
