import { Page } from 'puppeteer';
import fs from 'fs/promises';
import { harFromMessages } from 'chrome-har';

// event types to observe
const page_observe = [
    'Page.loadEventFired',
    'Page.domContentEventFired',
    'Page.frameStartedLoading',
    'Page.frameAttached',
    'Page.frameScheduledNavigation',
];

const network_observe = [
    'Network.requestWillBeSent',
    'Network.requestServedFromCache',
    'Network.dataReceived',
    'Network.responseReceived',
    'Network.resourceChangedPriority',
    'Network.loadingFinished',
    'Network.loadingFailed',
    'Network.responseReceivedExtraInfo'
];

class PuppeteerHar {
    private page: Page;
    private inProgress: boolean;
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

    async start({ path, saveResponse, captureMimeTypes } = {}): Promise<void> {
        this.inProgress = true;
        this.saveResponse = saveResponse || false;
        this.captureMimeTypes = captureMimeTypes || ['text/html', 'application/json'];
        this.path = path;
        const this.client = await this.page.target().createCDPSession();
        await this.client.send('Page.enable');
        await this.client.send('Network.enable');
        page_observe.forEach(method => {
            this.client.on(method, params => {
                if (!this.inProgress) {
                    return;
                }
                this.pageEvents.push({ method, params });
            });
        });
        network_observe.forEach(method => {
            this.client.on(method, params => {
                if (!this.inProgress) {
                    return;
                }
                this.networkEvents.push({ method, params });

                if (saveResponse && method == 'Network.responseReceived') {
                    const response = params.response;
                    const requestId = params.requestId;
                    
                    // Response body is unavailable for redirects, no-content, image, audio and video responses
                    if (response.status !== 204 &&
                        response.headers.location == null &&
                        this.captureMimeTypes.includes(response.mimeType)
                    ) {
                        const promise = this.client.send(
                            'Network.getResponseBody', { requestId },
                        ).then((responseBody) => {
                            // Set the response so `chrome-har` can add it to the HAR
                            params.response.body = new Buffer.from(
                                responseBody.body,
                                responseBody.base64Encoded ? 'base64' : undefined,
                            ).toString();
                        }, (reason) => {
                            // Resources (i.e. response bodies) are flushed after page commits
                            // navigation and we are no longer able to retrieve them. In this
                            // case, fail soft so we still add the rest of the response to the
                            // HAR. Possible option would be force wait before navigation...
                        });
                        this.responseBodyPromises.push(promise);
                    }
                }
            });
        });
    }

    async stop(): Promise<void> {
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