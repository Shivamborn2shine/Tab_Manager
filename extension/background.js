// Tab Manager Extension Background Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'OPEN_TABS' && Array.isArray(request.urls)) {
    request.urls.forEach((url, index) => {
      // Use setTimeout to stagger slightly, preventing browser from freezing or rejecting multiple extensions calls
      setTimeout(() => {
        try {
          chrome.tabs.create({ url, active: false });
        } catch(e) { console.error(e) }
      }, index * 50);
    });
    // Send response back
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});
