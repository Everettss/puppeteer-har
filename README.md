# pptr-har

generate a har (http archive format) file with [puppeteer](https://github.com/GoogleChrome/puppeteer).

## Usage

```javascript
const puppeteer = require('puppeteer');
const PuppeteerHar = require('puppeteer-har');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const har = new PuppeteerHar(page);
  await har.start({ path: 'results.har' });

  await page.goto('http://example.com');

  await har.stop();
  await browser.close();
})();
```
