export async function getData(key) {
    const result = await chrome.storage.local.get(key);
    return result[key];
}

export async function setData(key, value) {
    await chrome.storage.local.set({ [key]: value });
}