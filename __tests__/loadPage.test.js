import path from 'node:path';
import fsp from 'fs/promises';
import nock from 'nock';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import generateFilePath from '../src/utils/generatePath.js';
import downloadPage from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputDir = path.join(__dirname, 'tmp');
const fixturesPath = path.join(__dirname, '..', '__fixtures__');
const expectedDir = path.join(outputDir, 'ru-hexlet-io-courses_files');

describe('Check downloadPage', () => {
  const url = 'https://ru.hexlet.io/courses';
  const filePath = path.join(outputDir, 'ru-hexlet-io-courses_files', 'ru-hexlet-io-courses.html');
  const htmlContent = '<html><body>Test</body></html>';

  beforeEach(async () => {
    await fsp.rm(expectedDir, { recursive: true, force: true });
    await fsp.mkdir(expectedDir, { recursive: true });
  });

  test('Check download page and save in file', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, htmlContent);

    await downloadPage(url, outputDir);

    const stats = await fsp.stat(filePath);
    expect(stats.isFile()).toBe(true);
  });

  test('Check error when wrong url', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .replyWithError('Ошибка запроса');

    await expect(downloadPage(url, outputDir)).rejects.toThrow('Ошибка запроса');
  });

  test('Check create new folder', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, htmlContent);

    await downloadPage(url, outputDir);

    const stats = await fsp.stat(outputDir);
    expect(stats.isDirectory()).toBe(true);
  });

  test('Check download page and img', async () => {
    const html = await fsp.readFile(path.join(fixturesPath, 'courses.html'), 'utf-8');
    const expectedHtml = await fsp.readFile(path.join(fixturesPath, 'expectedHtml.html'), 'utf-8');
    const expectImg = await fsp.readFile(path.join(fixturesPath, '/assets/professions/nodejs.png'));
    const expectCSS = await fsp.readFile(path.join(fixturesPath, '/assets/professions/expectedCSS.css'));
    const expectJS = await fsp.readFile(path.join(fixturesPath, '/assets/professions/expectedJS.js'));

    nock('https://ru.hexlet.io')
      .persist() // Запросы можно делать несколько раз
      .get('/courses')
      .reply(200, html);

    nock('https://ru.hexlet.io')
      .persist()
      .get('/assets/professions/nodejs.png')
      .reply(200, expectImg);

    nock('https://ru.hexlet.io')
      .persist()
      .get('/assets/application.css')
      .reply(200, expectCSS);

    nock('https://ru.hexlet.io')
      .persist()
      .get('/packs/js/runtime.js')
      .reply(200, expectJS);

    await downloadPage(url, outputDir);

    const savedHtml = await fsp.readFile(path.join(expectedDir, 'ru-hexlet-io-courses.html'), 'utf-8');
    expect(savedHtml.trim()).toBe(expectedHtml.trim());

    const imagePath = path.join(expectedDir, 'ru-hexlet-io-assets-professions-nodejs.png');
    const downloadedImg = await fsp.readFile(imagePath);
    expect(downloadedImg).toEqual(expectImg);

    const cssPath = path.join(expectedDir, 'ru-hexlet-io-assets-application.css');
    const downloadedCSS = await fsp.readFile(cssPath);
    expect(downloadedCSS).toEqual(expectCSS);

    const jsPath = path.join(expectedDir, 'ru-hexlet-io-packs-js-runtime.js');
    const downloadedJS = await fsp.readFile(jsPath);
    expect(downloadedJS).toEqual(expectJS);
  });
});

describe('Check generateFilePath', () => {
  const outputDirForCheckGen = path.join(__dirname, 'tmp', 'ru-hexlet-io-courses_files');

  test('Check generate filename for base url', () => {
    const url = 'https://ru.hexlet.io/courses';
    const filePath = generateFilePath(url, outputDirForCheckGen, 'html');
    const expectedFilePath = path.join(outputDirForCheckGen, 'ru-hexlet-io-courses.html');
    expect(filePath).toBe(expectedFilePath);
  });

  test('Check replace symbols on dash', () => {
    const url = 'https://example.com/path?param=value#section';
    const filePath = generateFilePath(url, outputDirForCheckGen, 'html');
    const expectedFilePath = path.join(outputDirForCheckGen, 'example-com-path-param-value-section.html');
    expect(filePath).toBe(expectedFilePath);
  });

  test('Check work with special symbols in url', () => {
    const url = 'https://example.com/some_path?query=test&value=123';
    const filePath = generateFilePath(url, outputDirForCheckGen, 'html');
    const expectedFilePath = path.join(outputDirForCheckGen, 'example-com-some-path-query-test-value-123.html');
    expect(filePath).toBe(expectedFilePath);
  });

  test('Check work without symbols in url', () => {
    const url = 'https://test.com';
    const filePath = generateFilePath(url, outputDirForCheckGen, 'html');
    const expectedFilePath = path.join(outputDirForCheckGen, 'test-com.html');
    expect(filePath).toBe(expectedFilePath);
  });
});

afterAll(() => fsp.rm(outputDir, { recursive: true, force: true }));
