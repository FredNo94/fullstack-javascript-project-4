import { program } from 'commander';
import axios from 'axios';
import downloadPage from './index.js';

function cliLoadPage() {
  program
    .name('page-loader')
    .description('Utility for downloading web pages')
    .version('1.0.0')
    .argument('<url>', 'URL страницы')
    .option('-o --output [dir]', 'Output dir ', process.cwd())
    .action((url, dir) => {
      downloadPage(url, dir.output)
        .then()
        .catch((error) => {
          if (axios.isAxiosError(error)) {
            console.error(`Network error: ${url}: ${error.message}`);
            process.exit(1);
          } else if (error.code === 'EACCES' || error.code === 'ENOENT') {
            console.error(`File system error:  ${error.message}`);
            process.exit(2);
          } else {
            console.error(`Unexpected error: ${error.message}`);
            process.exit(3);
          }
        });
    });
  program.parse();
}

export default cliLoadPage;
