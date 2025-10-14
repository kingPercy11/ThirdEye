document.getElementById('pause').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'pause' });
});
document.getElementById('resume').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'resume' });
});
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    document.getElementById('status').textContent = response.tracking ? 'Tracking' : 'Paused';
});