import { useState } from 'react';
import { useTabStore } from '../store/useTabStore';
import { Search, Plus, Trash2, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function Sidebar({ onAddWorkspace }) {
  const workspaces = useTabStore((s) => s.workspaces);
  const activeWorkspaceId = useTabStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useTabStore((s) => s.setActiveWorkspace);
  const deleteWorkspace = useTabStore((s) => s.deleteWorkspace);
  const getTotalTabs = useTabStore((s) => s.getTotalTabs);
  const getTotalCollections = useTabStore((s) => s.getTotalCollections);
  const sidebarCollapsed = useTabStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useTabStore((s) => s.toggleSidebar);
  const [filter, setFilter] = useState('');
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(filter.toLowerCase())
  );

  const getWorkspaceTabCount = (workspace) =>
    workspace.collections.reduce((s, c) => s + c.tabs.length, 0);

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Layers size={20} />
          </div>
          <div className="sidebar-logo-text">
            <h1>Tab Manager</h1>
            <span>2.0</span>
          </div>
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="sidebar-search">
        <div className="sidebar-search-wrapper">
          <Search className="sidebar-search-icon" size={16} />
          <input
            className="sidebar-search-input"
            type="text"
            placeholder="Search workspaces..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">Workspaces</span>
          <button
            className="sidebar-section-action"
            onClick={onAddWorkspace}
            title="Add workspace"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="sidebar-workspace-list">
        {filteredWorkspaces.map((workspace) => (
          <div
            key={workspace.id}
            className={`workspace-item ${
              workspace.id === activeWorkspaceId ? 'active' : ''
            }`}
            onClick={() => setActiveWorkspace(workspace.id)}
          >
            <span className="workspace-emoji">{workspace.emoji}</span>
            <div className="workspace-info">
              <div className="workspace-name">{workspace.name}</div>
              <div className="workspace-count">
                {workspace.collections.length} collections · {getWorkspaceTabCount(workspace)} tabs
              </div>
            </div>
            <div className="workspace-actions">
              {workspaces.length > 1 && (
                <button
                  className="workspace-action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkspaceToDelete(workspace);
                  }}
                  title="Delete workspace"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-stats">
          <div className="sidebar-stat">
            <div className="sidebar-stat-value">{workspaces.length}</div>
            <div className="sidebar-stat-label">Workspaces</div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-value">{getTotalCollections()}</div>
            <div className="sidebar-stat-label">Collections</div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-value">{getTotalTabs()}</div>
            <div className="sidebar-stat-label">Tabs</div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!workspaceToDelete}
        title="Delete Workspace?"
        message={`Are you sure you want to delete "${workspaceToDelete?.name}"? All collections and tabs inside it will be permanently lost.`}
        onCancel={() => setWorkspaceToDelete(null)}
        onConfirm={() => {
          if (workspaceToDelete) {
            deleteWorkspace(workspaceToDelete.id);
            setWorkspaceToDelete(null);
          }
        }}
      />
    </aside>
  );
}
