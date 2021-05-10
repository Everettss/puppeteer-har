import puppeteer, { Browser } from "puppeteer"
import { captureNetwork } from "./captureNetwork"

describe("captureNetwork", () => {
  let browser: Browser | void

  const getBrowser = async () => {
    if (browser == null) {
      browser = await puppeteer.launch()
    }

    return browser
  }

  const getPage = async () => await (await getBrowser()).newPage()

  afterAll(async () => {
    await (await getBrowser()).close()
  })

  it("should be possible to capture html contents.", async () => {
    const page = await getPage()

    const getHar = await captureNetwork(page, { saveResponses: true })

    await page.goto("https://www.google.com")

    const har = await getHar()

    const entry = har.log.entries.find(({ request }) => {
      return (
        request.method === "GET" && request.url === "https://www.google.com/"
      )
    })

    expect(entry?.response.content).not.toHaveProperty("text", undefined)
  })
})
