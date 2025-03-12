import fsp from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import debug from 'debug';
import Listr from 'listr';
import generatePath from './utils/generatePath.js';
import extractLocalResources from './utils/extractLocalResources.js';

const log = debug('page-loader');

function downloadPage(url, outputDir = process.cwd()) {
  log(`Run load for URL: ${url}`);
  const baseUrl = new URL(url).origin;
  const newOutputDir = generatePath(url, outputDir, 'dir');
  const outputFilePath = generatePath(url, newOutputDir, 'html');
  let html;

  return axios.get(url, { responseType: 'arraybuffer' })
    .then((response) => {
      log('HTML-page loaded');
      if (response.status !== 200) {
        throw new Error(`Network error: ${url}: ${response.status} ${response.statusText}`);
      }
      html = response.data;
      return fsp.mkdir(newOutputDir, { recursive: true })
        .catch((error) => {
          log(`File system error: ${error.message}`);
          throw new Error(`File system error: ${error.message}`);
        });
    })
    .then(() => {
      log(`Directory created: ${newOutputDir}`);
      const $ = cheerio.load(html);
      const resources = extractLocalResources($, baseUrl);

      const convertedResources = resources.map((res) => {
        const ext = path.extname(res.srcBase).slice(1);
        const filePathForSave = generatePath(res.absolutPathInHTML, newOutputDir, ext);
        log(`Resource found: ${res.absolutPathInHTML}, saving to: ${filePathForSave}`);
        return { ...res, filePathForSave };
      });

      return convertedResources;
    })
    .then((convertedResources) => {
      log(`Downloading ${convertedResources.length} resources...`);
      const tasks = new Listr(
        convertedResources.map((res) => ({
          title: `${res.absolutPathInHTML}`,
          task: () => axios.get(res.absolutPathInHTML, { responseType: 'arraybuffer' })
            .then((response) => {
              log(`Saving resource: ${res.filePathForSave}`);
              return fsp.writeFile(res.filePathForSave, response.data);
            }),
        })),
        { concurrent: true, exitOnError: false },
      );

      return tasks.run().then(() => convertedResources);
    })
    .then((convertedResources) => {
      log('Updating HTML with local resource paths...');
      const $ = cheerio.load(html);
      convertedResources.forEach(({
        tag, attr, srcBase, filePathForSave,
      }) => {
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
      log(`Page was successfully downloaded into: '${newOutputDir}'`);
      console.log(`Page was successfully downloaded into '${newOutputDir}'`);
    })
    .catch((error) => {
      if (error.response || error.request) {
        log(`Network error: ${error.message}`);
        throw new Error(`Network error: ${url}: ${error.message}`);
      } else if (error.code === 'EACCES' || error.code === 'ENOENT') {
        log(`File system error: ${error.message}`);
        throw new Error(`File system error: ${error.message}`);
      } else {
        log(`Unexpected error: ${error.message}`);
        throw new Error(`Unexpected error: ${error.message}`);
      }
    });
}

export default downloadPage;
