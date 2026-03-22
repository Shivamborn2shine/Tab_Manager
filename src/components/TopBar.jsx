import { useTabStore } from '../store/useTabStore';
import { Search, Plus, Download, Upload, CheckSquare, RefreshCw, PictureInPicture2, ListTodo } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import Board from './Board';

export default function TopBar({ onOpenCommandPalette, onAddCollection, onImportTabs, onToggleTodo }) {
  const workspace = useTabStore((s) => s.workspaces.find(w => w.id === s.activeWorkspaceId));
  const addToast = useTabStore((s) => s.addToast);
  const selectionMode = useTabStore((s) => s.selectionMode);
  const toggleSelectionMode = useTabStore((s) => s.toggleSelectionMode);

  if (!workspace) return null;

  const totalTabs = workspace.collections.reduce((s, c) => s + c.tabs.length, 0);

  const handleExport = () => {
    const exportData = {
      workspace: workspace.name,
      emoji: workspace.emoji,
      exportedAt: new Date().toISOString(),
      collections: workspace.collections.map((c) => ({
        name: c.name,
        color: c.color,
        tabs: c.tabs.map((t) => ({
          title: t.title,
          url: t.url,
          pinned: t.pinned,
        })),
      })),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workspace.name.replace(/\s+/g, '_').toLowerCase()}_tabs.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast(`Exported ${totalTabs} tabs from "${workspace.name}"`);
  };

  const handlePiP = async () => {
    if (!('documentPictureInPicture' in window)) {
      addToast('Picture-in-Picture API is not supported in your browser.', 'error');
      return;
    }
    
    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 800,
        height: 600,
      });

      // Copy styles
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWin.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = styleSheet.type;
          link.media = styleSheet.media;
          link.href = styleSheet.href;
          pipWin.document.head.appendChild(link);
        }
      });

      // Prepare root container
      const pipRoot = document.createElement('div');
      pipRoot.className = 'app-layout';
      
      const mainContent = document.createElement('div');
      mainContent.className = 'main-content board-pip';
      mainContent.style.width = '100%';
      mainContent.style.height = '100vh';
      mainContent.style.overflow = 'auto';
      mainContent.style.padding = '20px'; // Add some padding so it looks nice
      
      pipRoot.appendChild(mainContent);
      pipWin.document.body.appendChild(pipRoot);

      const root = createRoot(mainContent);
      root.render(
        <Board />
      );

      pipWin.addEventListener('pagehide', () => {
        root.unmount();
      });
      
      addToast('Opened Tab Manager in Picture-in-Picture');
    } catch (err) {
      console.error(err);
      addToast('Failed to open Picture-in-Picture', 'error');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-workspace-title">
          {workspace.emoji} {workspace.name}
        </h2>
        <span className="topbar-workspace-badge">{totalTabs} tabs</span>
      </div>
      <div className="topbar-right">
        <button className="topbar-btn" onClick={onToggleTodo} title="To-Do List">
          <ListTodo size={16} />
          Tasks
        </button>
        <button className="topbar-btn" onClick={handlePiP} title="Picture-in-Picture">
          <PictureInPicture2 size={16} />
          PiP Mode
        </button>
        <button className="topbar-btn" onClick={() => window.location.reload()} title="Refresh App">
          <RefreshCw size={16} />
          Refresh
        </button>
        <button className="topbar-btn" onClick={onOpenCommandPalette}>
          <Search size={16} />
          Search
          <span className="topbar-shortcut">Ctrl+K</span>
        </button>
        <button
          className={`topbar-btn ${selectionMode ? 'active' : ''}`}
          onClick={toggleSelectionMode}
          title={selectionMode ? 'Exit selection mode' : 'Select tabs'}
        >
          <CheckSquare size={16} />
          {selectionMode ? 'Deselect' : 'Select'}
        </button>
        <button className="topbar-btn" onClick={onImportTabs}>
          <Download size={16} />
          Import
        </button>
        <button className="topbar-btn" onClick={handleExport}>
          <Upload size={16} />
          Export
        </button>
        <button className="topbar-btn primary" onClick={onAddCollection}>
          <Plus size={16} />
          Add Collection
        </button>
      </div>
    </header>
  );
}

