# puppeteer-har
[![npm version][1]][2] 

Generate HAR file with [puppeteer](https://github.com/GoogleChrome/puppeteer).

## Install

```
npm install puppeteer-har
```

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

### PuppeteerHar(page)
- `page` <[Page]>

### har.start([options])
- `options` <?[Object]> Optional
  - `path` <[string]> If set HAR file will be written at this path
- returns: <[Promise]>

### har.stop()
- returns: <[Promise]<?[Object]>> If path is not set in `har.start` Promise will return object with HAR.

[1]: https://img.shields.io/npm/v/puppeteer-har.svg?style=flat-square
[2]: https://npmjs.org/package/puppeteer-har
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Page]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
