import path from 'path';

function generateFilePath(url, outputDir, type) {
  const basename = `${url
    .replace(/^https?:\/\//, '') // Убираем http(s)://
    .replace(/.png/, '') // Убираем расширение
    .replace(/[^a-zA-Z0-9]/g, '-')}`; // Заменяем всё, кроме букв/цифр, на "-"

  switch (type) {
    case 'html':
      return path.join(outputDir, `${basename}.html`);
    case 'png':
      return path.join(outputDir, `${basename}.png`);
    case 'dir':
      return path.join(outputDir, `${basename}_files`);
    default:
      return new Error('wrong  type');
  }
}

export default generateFilePath;
