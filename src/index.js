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
  const outputFilePath = generatePath(url, outputDir, 'html');
  let html;

  return fsp.access(outputDir)
    .catch(() => {
      log(`Output directory does not exist: ${outputDir}`);
      throw new Error(`Output directory does not exist: ${outputDir}`);
    })
    .then(() => axios.get(url, { responseType: 'arraybuffer' }))
    .then((response) => {
      log('HTML-page loaded');
      html = response.data;
      return fsp.mkdir(newOutputDir, { recursive: true });
    })
    .then(() => {
      log(`Directory created: ${newOutputDir}`);
      const $ = cheerio.load(html);
      const resources = extractLocalResources($, baseUrl);

      const convertedResources = resources.map((res) => {
        const ext = path.extname(res.srcBase).slice(1) || 'html';
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
            .then((response) => fsp.writeFile(res.filePathForSave, response.data)),
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
            const relativePath = path.relative(outputDir, filePathForSave);
            $(el).attr(attr, relativePath);
          }
        });
      });

      const updatedHtml = $.html({ decodeEntities: false });
      return fsp.writeFile(outputFilePath, updatedHtml).then(() => newOutputDir);
    })
    .catch((error) => {
      log(`Error: ${error.message}`);
      console.error(`Error: ${error.message}`);
      throw error;
    });
}

export default downloadPage;
