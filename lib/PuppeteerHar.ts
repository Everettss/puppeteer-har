import { Page, CDPSession } from 'puppeteer';
import fs from 'fs/promises';
import { harFromMessages } from 'chrome-har';

const pageObserve: string[] = [
    'Page.loadEventFired',
    'Page.domContentEventFired',
    'Page.frameStartedLoading',
    'Page.frameAttached',
    'Page.frameScheduledNavigation',
];

const networkObserve: string[] = [
    'Network.requestWillBeSent',
    'Network.requestServedFromCache',
    'Network.dataReceived',
    'Network.responseReceived',
    'Network.resourceChangedPriority',
    'Network.loadingFinished',
    'Network.loadingFailed',
    'Network.responseReceivedExtraInfo'
];

interface HarOptions {
    path?: string;
    saveResponse?: boolean;
    captureMimeTypes?: string[];
};

class PuppeteerHar {
    private page: Page;
    private inProgress: boolean;
    private path?: string;
    private saveResponse!: boolean;
    private captureMimeTypes!: string[];
    private client!: CDPSession;
    private networkEvents: any[];
    private pageEvents: any[];
    private responseBodyPromises: any[];

    constructor(page: Page) {
        this.page = page;
        this.inProgress = false; 
        this.networkEvents = [];
        this.pageEvents = [];
        this.responseBodyPromises = [];
        this.cleanUp();
    }

    cleanUp(): void {
        this.networkEvents = [];
        this.pageEvents = [];
        this.responseBodyPromises = [];
    }

    public async start(options: HarOptions = {}): Promise<void> {
        const { path, saveResponse = false, captureMimeTypes = ['text/html', 'application/json'] } = options;
        this.inProgress = true;
        this.saveResponse = saveResponse;
        this.captureMimeTypes = captureMimeTypes;
        this.path = path;
        this.client = await this.page.target().createCDPSession();
        await this.client.send('Page.enable');
        await this.client.send('Network.enable');
        pageObserve.forEach(method => {
            this.client.on(method, (params: any) => {
                if (!this.inProgress) {
                    return;
                }
                this.pageEvents.push({ method, params });
            });
        });
        networkObserve.forEach(method => {
            this.client.on(method, (params: any) => {
                if (!this.inProgress) {
                    return;
                }
                this.networkEvents.push({ method, params });

                if (saveResponse && method == 'Network.responseReceived') {
                    const response = params.response as any;
                    const requestId = params.requestId as string;
                    
                    // Response body is unavailable for redirects, no-content, image, audio and video responses
                    if (response.status !== 204 &&
                        response.headers.location == null &&
                        this.captureMimeTypes.includes(response.mimeType)
                    ) {
                        const handleResponseBody = async () => {
                            try {
                                const responseBody = await this.client.send('Network.getResponseBody', { requestId });
                                params.response.body = Buffer.from(
                                    responseBody.body,
                                    responseBody.base64Encoded ? 'base64' : undefined,
                                ).toString();
                            } catch (reason) {
                                console.log(`Reason: ${reason}`)
                            }
                        }
                        this.responseBodyPromises.push(handleResponseBody());
                    }
                }
            });
        });
    }

    public async stop(): Promise<void> {
        this.inProgress = false; 
        await Promise.all(this.responseBodyPromises);
        await this.client.detach();
        const har = harFromMessages(
            this.pageEvents.concat(this.networkEvents),
            {includeTextFromResponseBody: this.saveResponse}
        );
        this.cleanUp();
        if (this.path) {
            await fs.writeFile(this.path, JSON.stringify(har));
        } else {
            return har;
        }
    }
}

module.exports = PuppeteerHar;