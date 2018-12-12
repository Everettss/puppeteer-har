const fs = require('fs');
const { promisify } = require('util');
const { harFromMessages } = require('chrome-har');

// event types to observe
const observe = [
    'Page.loadEventFired',
    'Page.domContentEventFired',
    'Page.frameStartedLoading',
    'Page.frameAttached',
    'Page.frameScheduledNavigation',
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
        observe.forEach(method => {
            this.client.on(method, params => {
                this.events.push({ method, params });
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
