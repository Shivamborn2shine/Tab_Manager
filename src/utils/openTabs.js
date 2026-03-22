export const openTabs = (urls) => {
  if (!urls || urls.length === 0) return;

  // The content.js script from our Chrome Extension adds this attribute to the HTML tag
  const hasExtension = document.documentElement.hasAttribute('data-tab-manager-extension');
  
  if (hasExtension) {
    // Secretly pass the URLs to the extension content script, which will 
    // relay it to the background worker to natively call chrome.tabs.create
    window.postMessage({ type: 'TAB_MANAGER_OPEN_TABS', urls }, '*');
  } else {
    // Fallback to window.open. Without the extension, popup blockers might
    // restrict opening multiple tabs at once.
    urls.forEach((url) => {
      window.open(url, '_blank', 'noopener');
    });
  }
};
