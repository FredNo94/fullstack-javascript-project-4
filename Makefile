install: 
	npm ci

publish:
	npm publish --dry-run

page-loader:
	node bin/loadPage.js

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

publish:
	npm publish