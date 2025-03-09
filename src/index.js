import fsp from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import generatePath from './utils/generatePath.js';
import extractLocalResources from './utils/extractLocalResources.js';
import debug from 'debug';

const log = debug('page-loader');

function downloadPage(url, outputDir = '/home/user/current-dir') {
  log(`Run load for URL: ${url}`);
  const baseUrl = new URL(url).origin;
  const newOutputDir = generatePath(url, outputDir, 'dir');
  const outputFilePath = generatePath(url, newOutputDir, 'html');
  let html;

  return axios.get(url, { responseType: 'arraybuffer' })
    .then((response) => {
      log('HTML-page loaded');
      html = response.data;
      return fsp.mkdir(newOutputDir, { recursive: true });
    })
    .then(() => {
      const $ = cheerio.load(html);
      const resources = extractLocalResources($, baseUrl);

      const convertedResources = resources.map((res) => {
        const ext = path.extname(res.srcBase).slice(1);
        const filePathForSave = generatePath(res.absolutPathInHTML, newOutputDir, ext);
        return { ...res, filePathForSave };
      });

      return convertedResources;
    })
    .then((convertedResources) => {
      const downloadPromises = convertedResources.map((res) =>
        axios.get(res.absolutPathInHTML, { responseType: 'arraybuffer' })
          .then((response) => {
            log(`Saving a resource: ${res.filePathForSave}`);
            return fsp.writeFile(res.filePathForSave, response.data);
          })
      );

      return Promise.all(downloadPromises).then(() => convertedResources);
    })
    .then((convertedResources) => {
      log('Updating HTML...');
      const $ = cheerio.load(html);
      convertedResources.forEach(({ tag, attr, srcBase, filePathForSave }) => {
        $(tag).each((_, el) => {
          if ($(el).attr(attr) === srcBase) {
            $(el).attr(attr, path.relative(outputDir, filePathForSave));
          }
        });
      });

      const updatedHtml = $.html({ decodeEntities: false });
      return fsp.writeFile(outputFilePath, updatedHtml);
    })
    .then(() => {
      log(`Page was successfully downloaded into: '${outputFilePath}'`);
      console.log(`Page was successfully downloaded into '${outputFilePath}'`);
    })
    .catch((error) => {
      log(`Error: ${error.message}`);
      throw error;
    });
}

export default downloadPage;
