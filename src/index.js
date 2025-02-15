import fsp from 'fs/promises';
import axios from 'axios';
import generateFilePath from './generateFilePath.js';

function downloadPage(url, outputDir = '/home/user/current-dir') {
  const outputFilePath = generateFilePath(url, outputDir);

  return axios.get(url)
    .then((response) => response.data)
    .then((html) => fsp.mkdir(outputDir, { recursive: true })
      .then(() => fsp.writeFile(outputFilePath, html)))
    .then(() => {
      console.log(`Страница сохранена в: ${outputFilePath}`);
      return outputFilePath;
    })
    .catch((error) => {
      console.error('Ошибка:', error.message);
      throw error;
    });
}

export default downloadPage;
