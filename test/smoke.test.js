const puppeteer = require('puppeteer');
const PuppeteerHar = require('..');

const assert = require('assert');
const fs = require('fs');
const HAR_FILE = __dirname + '/results.har.json';

describe('Smoke test', async () => {

  before(() => {
    if (fs.existsSync(HAR_FILE)) {
      fs.unlinkSync(HAR_FILE);
    }
  });

  it('should generate HAR file', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const har = new PuppeteerHar(page);
    await har.start({ path: HAR_FILE });

    await page.goto('http://google.com');

    await har.stop();
    await browser.close();

    assert(fs.existsSync(HAR_FILE), `HAR file not generated: [${HAR_FILE}]`);
    const harcontents = require(HAR_FILE);
    console.log('Generated HAR:');
    console.log(harcontents);
    assert(harcontents.log, 'Generated HAR does not have log field');
    ['version', 'creator', 'pages', 'entries'].forEach(field => {
      assert(harcontents.log[field], `Generated HAR does not have log field named: [log.${field}]`);
    });

  });

});
