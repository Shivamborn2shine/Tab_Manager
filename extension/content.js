// Tab Manager Extension Content Script

// Let the web app know that the extension is installed
document.documentElement.setAttribute('data-tab-manager-extension', 'true');

// Listen for messages from the web app
window.addEventListener('message', (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data && event.data.type === 'TAB_MANAGER_OPEN_TABS') {
    chrome.runtime.sendMessage({
      type: 'OPEN_TABS',
      urls: event.data.urls
    });
  }
});
