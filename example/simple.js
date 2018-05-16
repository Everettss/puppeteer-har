const puppeteer = require('puppeteer');
const PuppeteerHar = require('../');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const har = new PuppeteerHar(page);
    await har.start();

    await page.goto('http://www.yahoo.com');

    const harResult = await har.stop();
    console.log(JSON.stringify(harResult, null, 2));

    await browser.close();
})();
