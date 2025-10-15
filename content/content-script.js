// === content/content-script.js ===

// Throttle to avoid flooding messages
let lastSent = 0;
let isUnloaded = false;

function sendPageInfo() {
  if (isUnloaded) return; // don't run after unload

  const now = Date.now();
  if (now - lastSent < 2000) return; // send at most once every 2s
  lastSent = now;

  try {
    if (!chrome?.runtime?.id) return; // context gone
    chrome.runtime.sendMessage({
      action: 'pageInfo',
      title: document.title,
      url: window.location.href
    });
  } catch (err) {
    // Gracefully handle invalid context without throwing
    if (err.message?.includes("Extension context invalidated")) {
      console.warn("⚠️ Context invalidated, stopping observer.");
      cleanup();
    } else {
      console.warn("⚠️ Could not send page info:", err);
    }
  }
}

function cleanup() {
  isUnloaded = true;
  observer.disconnect();
}

// Send info immediately when page loads
sendPageInfo();

// Observe DOM changes (for SPAs like YouTube)
const observer = new MutationObserver(sendPageInfo);
observer.observe(document.body, { childList: true, subtree: true });

// Clean up properly when tab unloads or SPA navigation happens
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);