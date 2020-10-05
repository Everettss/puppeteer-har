import { Frame, Page } from "puppeteer";
export default class PuppeteerHar {
    readonly page: Page;
    readonly mainFrame: Frame;
    private network_events;
    private page_events;
    private response_body_promises;
    private client;
    private path;
    private captureMimeTypes;
    private saveResponse;
    inProgress: boolean;
    constructor(page: Page);
    /**
     * @returns {void}
     */
    cleanUp(): void;
    /**
     * @param {{path: string}=} options
     * @return {Promise<void>}
     */
    start({ path, saveResponse, captureMimeTypes, }?: {
        path?: string;
        saveResponse?: boolean;
        captureMimeTypes?: string[];
    }): Promise<void>;
    stop(): Promise<object | void>;
}
