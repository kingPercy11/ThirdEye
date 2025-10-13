importScripts('utils.js'); // Optional helpers

let activeTabId = null;
let startTime = null;
let tracking = true;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await handleTabChange(activeInfo.tabId);
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        pauseTracking();
    } else if (tracking) {
        const [tab] = await chrome.tabs.query({ active: true, windowId });
        handleTabChange(tab.id);
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'pageInfo' && sender.tab.id === activeTabId) {
        storeTabData(message);
    }
});

async function handleTabChange(tabId) {
    if (activeTabId !== null && startTime) {
        const duration = Date.now() - startTime;
        await storeData({ tabId: activeTabId, duration, timestamp: Date.now() });
    }
    activeTabId = tabId;
    startTime = Date.now();
}

function pauseTracking() {
    tracking = false;
}

function resumeTracking() {
    tracking = true;
}

async function storeTabData(data) {
    await storeData({ ...data, timestamp: Date.now() });
}


async function storeData(record) {
    const { tabTrackingData } = await chrome.storage.local.get('tabTrackingData') || { tabTrackingData: [] };
    tabTrackingData.push(record);
    chrome.storage.local.set({ tabTrackingData });
}