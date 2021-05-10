# puppeteer-har

Generate HAR file with [puppeteer](https://github.com/GoogleChrome/puppeteer).

## Install

```
yarn add @auteon/puppeteer-har
```

## Usage

```es6
import puppeteer from "puppeteer"
import { captureNetwork } from "puppeteer-har"

const browser = await puppeteer.launch()
const page = await browser.newPage()

const getHar = await captureNetwork(page)

await page.goto("http://example.com")

const har = await getHar()
await browser.close()
```

## `captureNetwork(page[, options])`

Start capturing the network traffic of the given puppeteer page.

### Returns

`captureHar` returns a method that will stop capturing traffic and return a HAR file when called.

### `options`

#### `saveResponses`

Defaults to `false`.
If set the HAR file will also include the responses to network requests.

#### `captureMimeTypes`

Defaults to `['text/html', 'application/json']`.
When responses should be saved you can specify which response types to include through this array.
