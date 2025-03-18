import { program } from 'commander';
import downloadPage from './index.js';

function cliLoadPage() {
  program
    .name('page-loader')
    .description('Utility for downloading web pages')
    .version('1.0.0')
    .argument('<url>', 'URL страницы')
    .option('-o --output [dir]', 'Output dir ', process.cwd())
    .action((url, { output }) => {
      downloadPage(url, output)
        .then((outputDir) => {
          console.log(`Page was successfully downloaded into '${outputDir}'`);
          process.exit(0);
        })
        .catch((error) => {
          console.error('Error occurred:', error.message);
          process.exit(1);
        });
    });
  program.parse();
}

export default cliLoadPage;
