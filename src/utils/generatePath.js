import path from 'path';

function generateFilePath(url, outputDir, type) {
  let basename = url.replace(/^https?:\/\//, '');

  if (basename.includes('/')) {
    basename = basename.replace(/\.\w+$/, '');
  }
  basename = basename.replace(/[^a-zA-Z0-9]/g, '-');

  switch (type) {
    case 'dir':
      return path.join(outputDir, `${basename}_files`);
    case 'html':
      return path.join(outputDir, `${basename}.html`);
    case 'png':
      return path.join(outputDir, `${basename}.png`);
    case 'css':
      return path.join(outputDir, `${basename}.css`);
    case 'js':
      return path.join(outputDir, `${basename}.js`);
    default:
      return path.join(outputDir, `${basename}.html`);
  }
}

export default generateFilePath;
