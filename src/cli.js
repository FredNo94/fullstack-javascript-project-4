import { program } from 'commander';
import downloadPage from './index.js';

function cliLoadPage() {
  program
    .name('page-loader')
    .description('Utility for downloading web pages')
    .version('1.0.0')
    .argument('<url>', 'URL страницы')
    .option('-o --output [dir]', 'Output dir ', process.cwd())
    .action((url, dir) => {
      try {
        console.log(downloadPage(url, dir.output));
      } catch (error) {
        console.log(error);
      }
    });
  program.parse();
}

export default cliLoadPage;
