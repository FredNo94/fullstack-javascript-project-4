import path from 'node:path';
import fsp from 'fs/promises';
import nock from 'nock';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import generateFilePath from '../src/generateFilePath.js';
import downloadPage from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Check downloadPage', () => {
  const url = 'https://ru.hexlet.io/courses';
  const outputDir = path.join(__dirname, 'tmp');
  const filePath = path.join(outputDir, 'ru-hexlet-io-courses.html');
  const htmlContent = '<html><body>Test</body></html>';

  beforeEach(async () => {
    await fsp.mkdir(outputDir, { recursive: true });
    await fsp.rmdir(outputDir, { recursive: true });
  });

  test('Check download page and save in file', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, htmlContent);

    await downloadPage(url, outputDir);

    const fileExists = await fsp.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
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

    const dirExists = await fsp.access(outputDir).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);
  });
});

describe('Check generateFilePath', () => {
  const outputDir = path.join(__dirname, 'tmp');

  test('Check generate filename for base url', () => {
    const url = 'https://ru.hexlet.io/courses';
    const filePath = generateFilePath(url, outputDir);
    const expectedFilePath = path.join(outputDir, 'ru-hexlet-io-courses.html');
    expect(filePath).toBe(expectedFilePath);
  });

  test('Check replace symbols on dash', () => {
    const url = 'https://example.com/path?param=value#section';
    const filePath = generateFilePath(url, outputDir);
    const expectedFilePath = path.join(outputDir, 'example-com-path-param-value-section.html');
    expect(filePath).toBe(expectedFilePath);
  });

  test('Check work with special symbols in url', () => {
    const url = 'https://example.com/some_path?query=test&value=123';
    const filePath = generateFilePath(url, outputDir);
    const expectedFilePath = path.join(outputDir, 'example-com-some-path-query-test-value-123.html');
    expect(filePath).toBe(expectedFilePath);
  });

  test('Check work without symbols in url', () => {
    const url = 'https://test.com';
    const filePath = generateFilePath(url, outputDir);
    const expectedFilePath = path.join(outputDir, 'test-com.html');
    expect(filePath).toBe(expectedFilePath);
  });
});
