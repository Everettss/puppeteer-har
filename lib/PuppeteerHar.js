const fs = require('fs');
const { promisify } = require('util');
const { harFromMessages } = require('chrome-har');

// event types to observe
const observe = [
    'Page.loadEventFired',
    'Page.domContentEventFired',
    'Page.frameAttached',
    'Page.frameStartedLoading',
    'Page.frameScheduledNavigation',
    'Network.requestWillBeSent',
    'Network.requestServedFromCache',
    'Network.responseReceived',
    'Network.dataReceived',
    'Network.loadingFinished',
    'Network.loadingFailed',
    'Network.resourceChangedPriority'
];

class PuppeteerHar {

    /**
     * @param {object} page
     */
    constructor(page) {
        this.page = page;
        this.events = [];
    }

    /**
     * @param {{path: string}=} options
     * @return {Promise<void>}
     */
    async start({ path } = {}) {
        this.path = path;
        this.client = await this.page.target().createCDPSession();
        await this.client.send('Page.enable');
        await this.client.send('Network.enable');
        let haveSeenPageEvent = false;
        let holdUntilPageEvent = [];
        observe.forEach(async method => {
            await this.client.on(method, params => {
                // these are the methods that chrome-har adds a page entry for
                if (method === 'Page.frameStartedLoading' || method === 'Page.frameScheduledNavigation') {
                    haveSeenPageEvent = true;
                }

                if (!haveSeenPageEvent) {
                    holdUntilPageEvent.push({ method, params })
                } else {
                    this.events.push({ method, params });
                    if (holdUntilPageEvent.length > 0) {
                        this.events = this.events.concat(holdUntilPageEvent);
                        holdUntilPageEvent = []
                    }
                }
            });
        });
    }

    /**
     * @returns {Promise<void|object>}
     */
    async stop() {
        await this.client.detach();
        const har = harFromMessages(this.events);
        if (this.path) {
            await promisify(fs.writeFile)(this.path, JSON.stringify(har));
        } else {
            return har;
        }
    }
}

module.exports = PuppeteerHar;
