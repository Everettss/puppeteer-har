const fs = require('fs');
const { promisify } = require('util');
const { harFromMessages } = require('chrome-har');

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
];

class PuppeteerHar {

    /**
     * @param {object} page
     */
    constructor(page) {
        this.page = page;
        this.mainFrame = this.page.mainFrame();
        this.network_events = [];
        this.page_events = [];
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
        page_observe.forEach(method => {
            this.client.on(method, params => {
                this.page_events.push({ method, params });
            });
        });
        network_observe.forEach(method => {
            this.client.on(method, params => {
                this.network_events.push({ method, params });
            });
        });
    }

    /**
     * @returns {Promise<void|object>}
     */
    async stop() {
        await this.client.detach();
        const har = harFromMessages(
            this.page_events.concat(this.network_events)
        );
        if (this.path) {
            await promisify(fs.writeFile)(this.path, JSON.stringify(har));
        } else {
            return har;
        }
    }
}

module.exports = PuppeteerHar;
