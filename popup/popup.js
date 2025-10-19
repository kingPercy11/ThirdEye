// Load dashboard URL from .env file
let DASHBOARD_URL = 'http://localhost:3000'; // Default fallback

async function loadDashboardUrl() {
    try {
        const envUrl = chrome.runtime.getURL('popup/.env');
        const response = await fetch(envUrl);
        if (!response.ok) {
            console.warn('Could not load popup/.env, using default dashboard URL');
            return;
        }
        const text = await response.text();
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const [key, ...rest] = trimmed.split('=');
            const k = key.trim();
            const value = rest.join('=').trim();
            if (k === 'DASHBOARD_URL' && value) {
                DASHBOARD_URL = value.replace(/(^['"]|['"]$)/g, '');
                console.log('Loaded DASHBOARD_URL from .env:', DASHBOARD_URL);
                break;
            }
        }
    } catch (err) {
        console.warn('Error loading popup/.env:', err);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load dashboard URL first
    await loadDashboardUrl();
    
    // Get DOM elements
    const pauseBtn = document.getElementById('pause');
    const resumeBtn = document.getElementById('resume');
    const statusDiv = document.getElementById('status');
    const analysisLink = document.getElementById('analysisLink');

    // View Analytics link
    if (analysisLink) {
        analysisLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: DASHBOARD_URL });
        });
    }

    // Pause tracking
    if (pauseBtn) {
        pauseBtn.addEventListener('click', async () => {
            try {
                await chrome.runtime.sendMessage({ action: 'pause' });
                updateStatus();
            } catch (err) {
                console.error('Error pausing:', err);
            }
        });
    }

    // Resume tracking
    if (resumeBtn) {
        resumeBtn.addEventListener('click', async () => {
            try {
                await chrome.runtime.sendMessage({ action: 'resume' });
                updateStatus();
            } catch (err) {
                console.error('Error resuming:', err);
            }
        });
    }

    // Update status display
    async function updateStatus() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
            if (response && response.tracking !== undefined) {
                statusDiv.textContent = response.tracking ? '✓ Tracking Active' : '⏸ Tracking Paused';
                statusDiv.className = response.tracking ? 'tracking' : 'paused';
            }
        } catch (err) {
            console.error('Error getting status:', err);
            statusDiv.textContent = '⚠ Status Unknown';
        }
    }

    // Update status on popup open
    updateStatus();
});