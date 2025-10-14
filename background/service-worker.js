let activeTabData = {};

let SERVER_URL = "http://localhost:5001";
let isPaused = false;

// persist/load paused state
chrome.storage?.local?.get?.(['paused'], (res) => {
  try { isPaused = !!res?.paused; } catch(e){ isPaused = false; }
});

// Load packaged background/.env (if present) and parse SERVER_URL
async function loadServerUrlFromEnv() {
  try {
    const url = chrome.runtime.getURL('background/.env');
    const resp = await fetch(url);
    if (!resp.ok) return;
    const text = await resp.text();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...rest] = trimmed.split('=');
      const key = k.trim();
      const value = rest.join('=').trim();
      if (key === 'SERVER_URL' && value) {
        SERVER_URL = value.replace(/(^['"]|['"]$)/g, '').replace(/\/+\*$/, '').replace(/\/+$/, '');
        break;
      }
    }
    console.log("Loaded SERVER_URL from background/.env ->", SERVER_URL);
  } catch (err) {
    console.warn("Could not load background/.env:", err);
  }
}

// Verify backend availability
async function pingServer() {
  try {
    const pingUrl = `${SERVER_URL.replace(/\/+$/, '')}/api/activities`;
    const resp = await fetch(pingUrl);
    if (resp.ok) {
      console.log("✅ Backend reachable:", pingUrl);
    } else {
      console.warn(`⚠️ Backend responded with ${resp.status}: ${resp.statusText}`);
    }
  } catch (e) {
    console.warn("⚠️ Could not reach backend:", e.message);
  }
}

// call loader and ping at startup
loadServerUrlFromEnv().then(pingServer);

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'pause') {
    isPaused = true;
    try { chrome.storage.local.set({ paused: true }); } catch(e){}
    sendResponse && sendResponse({ ok: true });
    return true;
  }
  if (message.action === 'resume') {
    isPaused = false;
    try { chrome.storage.local.set({ paused: false }); } catch(e){}
    sendResponse && sendResponse({ ok: true });
    return true;
  }
  if (message.action === 'getStatus') {
    sendResponse && sendResponse({ tracking: !isPaused });
    return true;
  }

  if (message.action === 'pageInfo') {
    if (isPaused) return;
    const { title, url } = message;
    const now = new Date();
    const tabId = sender?.tab?.id;
    if (tabId == null) return;
    if (!activeTabData[tabId]) {
      activeTabData[tabId] = { url, title, startTime: now };
    } else {
      const prev = activeTabData[tabId];
      if (prev.url !== url) {
        const endTime = now;
        const duration = Math.round((endTime - new Date(prev.startTime)) / 1000);
        await sendActivityToServer({ url: prev.url, title: prev.title, startTime: prev.startTime, endTime, duration });
        activeTabData[tabId] = { url, title, startTime: now };
      }
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = activeTabData[tabId];
  if (data) {
    const endTime = new Date();
    const duration = Math.round((endTime - new Date(data.startTime)) / 1000);
    await sendActivityToServer({ url: data.url, title: data.title, startTime: data.startTime, endTime, duration });
    delete activeTabData[tabId];
  }
});

async function sendActivityToServer(activityData) {
  try {
    const endpoint = `${SERVER_URL.replace(/\/+$/, '')}/api/activity`;
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activityData)
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error(`❌ Server error ${resp.status}: ${resp.statusText}\nResponse:`, text);
    } else {
      console.log("✅ Activity saved:", activityData);
    }
  } catch (err) {
    console.error("❌ Failed to send data:", err);
  }
}