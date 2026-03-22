import { useTabStore } from '../store/useTabStore';
import { Search, Plus, Download, Upload, CheckSquare, RefreshCw } from 'lucide-react';

export default function TopBar({ onOpenCommandPalette, onAddCollection, onImportTabs }) {
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

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-workspace-title">
          {workspace.emoji} {workspace.name}
        </h2>
        <span className="topbar-workspace-badge">{totalTabs} tabs</span>
      </div>
      <div className="topbar-right">
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

