import path from 'path';

function generateFilePath(url, outputDir) {
  const filename = `${url
    .replace(/^https?:\/\//, '') // Убираем http(s)://
    .replace(/[^a-zA-Z0-9]/g, '-')}.html`; // Заменяем всё, кроме букв/цифр, на "-"

  return path.join(outputDir, filename);
}

export default generateFilePath;
