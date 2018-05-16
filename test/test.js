const PuppeteerHar = require('../');

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

const mocks = {};

beforeEach(() => {
    mocks._listeners = {};
    mocks.client = {
        send: jest.fn(() => Promise.resolve()),
        on: jest.fn((meth, fn) => mocks._listeners[meth] = fn)
    };
    mocks.page = {
        target: jest.fn(() => {
            return { createCDPSession: jest.fn(() => Promise.resolve(mocks.client)) };
        })
    }
});

test('enables and listens', async () => {
    const har = new PuppeteerHar(mocks.page);
    await har.start();
    expect(mocks.client.send).toHaveBeenCalledWith('Page.enable');
    expect(mocks.client.send).toHaveBeenCalledWith('Network.enable');
    observe.forEach(meth => expect(mocks.client.on).toHaveBeenCalledWith(meth, expect.any(Function)))
});

test('waits for an initial Page. event', async () => {
    const har = new PuppeteerHar(mocks.page);
    await har.start();
    mocks._listeners['Network.requestWillBeSent']({});
    expect(har.events.length).toBe(0);
    mocks._listeners['Page.frameAttached']({});
    expect(har.events.length).toBe(0);
    mocks._listeners['Page.frameScheduledNavigation']({});
    expect(har.events.length).toBe(3);
    expect(har.events).toEqual([
        {
            method: 'Page.frameScheduledNavigation',
            params: {}
        },
        {
            method: 'Network.requestWillBeSent',
            params: {}
        },
        {
            method: 'Page.frameAttached',
            params: {}
        }
    ]);
    mocks._listeners['Network.loadingFailed']({});
    expect(har.events).toEqual([
        {
            method: 'Page.frameScheduledNavigation',
            params: {}
        },
        {
            method: 'Network.requestWillBeSent',
            params: {}
        },
        {
            method: 'Page.frameAttached',
            params: {}
        },
        {
            method: 'Network.loadingFailed',
            params: {}
        }
    ]);
});
