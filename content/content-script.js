// === content/content-script.js ===

(function () {
  try {
    // Throttle to avoid flooding messages
    let lastSent = 0;
    let isUnloaded = false;
    let observer = null;

    // replace the previous safeSendMessage with this hardened version
    let runtimeAlive = true;
    function safeSendMessage(message) {
      if (!runtimeAlive) return;
      try {
        // Probe chrome.runtime safely
        let runtime = null;
        try {
          runtime = (typeof globalThis !== 'undefined' ? globalThis.chrome : null);
          runtime = runtime && runtime.runtime ? runtime.runtime : null;
        } catch (probeErr) {
          runtime = null;
        }
        if (!runtime || typeof runtime.sendMessage !== 'function') return;

        // Call asynchronously so synchronous throws don't escape here
        setTimeout(() => {
          try {
            runtime.sendMessage(message);
          } catch (err) {
            // If the extension context is invalidated, stop further calls and cleanup
            if (err && typeof err.message === 'string' && err.message.includes('Extension context invalidated')) {
              runtimeAlive = false;
              try { cleanup(); } catch(e){/* ignore */ }
            } else {
              console.warn('⚠️ sendMessage failed (async):', err);
            }
          }
        }, 0);
      } catch (err) {
        if (err && typeof err.message === 'string' && err.message.includes('Extension context invalidated')) {
          runtimeAlive = false;
          try { cleanup(); } catch(e){/* ignore */ }
        } else {
          console.warn('⚠️ safeSendMessage probe failed:', err);
        }
      }
    }

    function sendPageInfo() {
      if (isUnloaded) return; // don't run after unload

      const now = Date.now();
      if (now - lastSent < 2000) return; // send at most once every 2s
      lastSent = now;

      try {
        safeSendMessage({
          action: 'pageInfo',
          title: document.title,
          url: window.location.href
        });
      } catch (err) {
        // Safety: any unexpected error should stop the observer but not crash the page
        console.warn('⚠️ Could not send page info:', err);
        cleanup();
      }
    }

    function cleanup() {
      isUnloaded = true;
      try { observer?.disconnect(); } catch (e) { /* ignore */ }
      observer = null;
    }

    // Initialize observer safely after a small delay to avoid races with worker reloads
    const start = () => {
      if (isUnloaded) return;
      try {
        sendPageInfo();
        observer = new MutationObserver(() => {
          try { sendPageInfo(); } catch (e) { /* swallow to avoid uncaught errors */ }
        });
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        } else {
          // fallback: try again shortly
          setTimeout(() => {
            try {
              if (document.body && observer) {
                observer.observe(document.body, { childList: true, subtree: true });
              }
            } catch (e) { /* ignore */ }
          }, 500);
        }
      } catch (err) {
        console.warn('Initialization error in content script:', err);
        cleanup();
      }
    };

    // Slight delay reduces race with worker reloads that can invalidate the extension context
    setTimeout(start, 300);

    // Clean up properly when tab unloads or SPA navigation happens
    try {
      // 'beforeunload' and 'unload' are restricted in some pages — avoid them.
      // Use 'pagehide' and 'visibilitychange' which are allowed and reliable for SPA navigation.
      window.addEventListener('pagehide', cleanup);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // send one last update (best-effort) and cleanup
          try { sendPageInfo(); } catch(e){/* ignore */ }
        }
      });
    } catch (e) { /* ignore */ }
  } catch (outerErr) {
    // Top-level safety: ensure no exception escapes content script execution
    console.warn('Content script failed to initialize:', outerErr);
    try { /* ensure observer is cleaned if partially created */ } catch(e){/*ignore*/}
  }
})();