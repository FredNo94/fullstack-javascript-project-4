import fsp from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import generatePath from './generatePath.js';
import convertToAbsoluteUrl from './convertToAbsoluteUrl.js';

function downloadPage(url, outputDir = '/home/user/current-dir') {
  const baseUrl = new URL(url).origin;
  const newOutputDir = generatePath(url, outputDir, 'dir');
  const outputFilePath = generatePath(url, newOutputDir, 'html');
  let html;

  return axios.get(url, { responseType: 'arraybuffer' })
    .then((response) => {
      html = response.data;
      return fsp.mkdir(newOutputDir, { recursive: true });
    })
    .then(() => {
      const $ = cheerio.load(html);
      const imageSources = $('img').map((_, img) => $(img).attr('src')).get();

      const convertedImages = imageSources.map((img) => {
        const absolutPath = convertToAbsoluteUrl(img, baseUrl);
        const pathForSave = generatePath(absolutPath, newOutputDir, 'png');
        return {
          srcBase: img,
          absolutPathInHTML: absolutPath,
          filePathForSave: pathForSave,
        };
      });
      return convertedImages;
    })
    .then((convertedImages) => {
      const downloadPromises = convertedImages.map((imgObj) => axios.get(imgObj.absolutPathInHTML, { responseType: 'arraybuffer' })
        .then((response) => fsp.writeFile(imgObj.filePathForSave, response.data)));

      return Promise.all(downloadPromises).then(() => convertedImages);
    })
    .then((convertedImages) => {
      const $ = cheerio.load(html);
      convertedImages.forEach(({ srcBase, filePathForSave }) => {
        $('img').each((_, img) => {
          if ($(img).attr('src') === srcBase) {
            $(img).attr('src', path.relative(outputDir, filePathForSave));
          }
        });
      });

      const updatedHtml = $.html({ decodeEntities: false });
      return fsp.writeFile(outputFilePath, updatedHtml);
    })
    .then(() => {
      console.log(`Страница сохранена в: ${outputFilePath}`);
    })
    .catch((error) => {
      throw error;
    });
}

export default downloadPage;
