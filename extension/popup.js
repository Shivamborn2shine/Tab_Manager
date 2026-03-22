// Tab Manager 2.0 — Chrome Extension Popup Script

// App URL — change this if you deploy the web app elsewhere
const TAB_MANAGER_URL = 'http://localhost:5173';

let allTabs = [];
let selectedTabIds = new Set();

// Filter out chrome:// and extension:// URLs that can't be opened by the web app
function isValidTab(tab) {
  if (!tab.url) return false;
  const url = tab.url;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('ftp://')
  );
}

function getFavicon(url) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function renderTabList(tabs) {
  const tabList = document.getElementById('tabList');
  const selectControls = document.getElementById('selectControls');

  if (tabs.length === 0) {
    tabList.innerHTML = '<div class="tab-list-empty">No saveable tabs found</div>';
    selectControls.style.display = 'none';
    return;
  }

  selectControls.style.display = 'flex';

  tabList.innerHTML = tabs
    .map(
      (tab) => `
    <label class="tab-item ${selectedTabIds.has(tab.id) ? 'selected' : ''}" data-tab-id="${tab.id}">
      <input type="checkbox" class="tab-checkbox" data-tab-id="${tab.id}" ${
        selectedTabIds.has(tab.id) ? 'checked' : ''
      } />
      <img class="tab-favicon" src="${getFavicon(tab.url)}" alt="" onerror="this.style.display='none'" />
      <div class="tab-info">
        <div class="tab-title">${escapeHtml(tab.title || 'Untitled')}</div>
        <div class="tab-url">${escapeHtml(getDomain(tab.url))}</div>
      </div>
    </label>
  `
    )
    .join('');

  updateSelectedCount();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateSelectedCount() {
  const count = selectedTabIds.size;
  document.getElementById('selectedCount').textContent = `${count} selected`;

  // Update button states
  const sendBtn = document.getElementById('sendToApp');
  const copyBtn = document.getElementById('copyToClipboard');
  sendBtn.disabled = count === 0;
  copyBtn.disabled = count === 0;
}

function getSelectedTabs() {
  return allTabs.filter((tab) => selectedTabIds.has(tab.id));
}

function buildTabData(tabs) {
  return tabs.map((tab) => ({
    url: tab.url,
    title: tab.title || '',
  }));
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `popup-status ${type}`;
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'popup-status';
  }, 4000);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get all tabs in the current window
    const tabs = await chrome.tabs.query({ currentWindow: true });
    allTabs = tabs.filter(isValidTab);

    // Count display
    document.getElementById('tabCount').textContent = `${allTabs.length} saveable tab${allTabs.length !== 1 ? 's' : ''} in this window`;

    // Select all by default
    allTabs.forEach((tab) => selectedTabIds.add(tab.id));

    renderTabList(allTabs);
  } catch (err) {
    document.getElementById('tabCount').textContent = 'Error loading tabs';
    console.error(err);
  }

  // Checkbox change handler (event delegation)
  document.getElementById('tabList').addEventListener('change', (e) => {
    if (e.target.classList.contains('tab-checkbox')) {
      const tabId = parseInt(e.target.dataset.tabId, 10);
      if (e.target.checked) {
        selectedTabIds.add(tabId);
        e.target.closest('.tab-item').classList.add('selected');
      } else {
        selectedTabIds.delete(tabId);
        e.target.closest('.tab-item').classList.remove('selected');
      }
      updateSelectedCount();
    }
  });

  // Select All
  document.getElementById('selectAll').addEventListener('click', () => {
    allTabs.forEach((tab) => selectedTabIds.add(tab.id));
    renderTabList(allTabs);
  });

  // Deselect All
  document.getElementById('deselectAll').addEventListener('click', () => {
    selectedTabIds.clear();
    renderTabList(allTabs);
  });

  // Send to Tab Manager — opens web app with encoded tab data in URL hash
  document.getElementById('sendToApp').addEventListener('click', async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      showStatus('No tabs selected', 'error');
      return;
    }

    const tabData = buildTabData(selected);
    const encoded = encodeURIComponent(JSON.stringify(tabData));
    const url = `${TAB_MANAGER_URL}/#import=${encoded}`;

    // Open the Tab Manager web app with tab data
    await chrome.tabs.create({ url });
    showStatus(`✓ Sending ${selected.length} tabs to Tab Manager!`);

    // Close popup after a brief delay
    setTimeout(() => window.close(), 500);
  });

  // Copy as JSON
  document.getElementById('copyToClipboard').addEventListener('click', async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      showStatus('No tabs selected', 'error');
      return;
    }

    const tabData = buildTabData(selected);
    const json = JSON.stringify(tabData, null, 2);
    await copyToClipboard(json);
    showStatus(`✓ ${selected.length} tabs copied to clipboard!`);
  });
});
