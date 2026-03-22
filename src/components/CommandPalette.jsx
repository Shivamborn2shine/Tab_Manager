import { useState, useRef, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';
import { Search, ExternalLink, ArrowRight } from 'lucide-react';

export default function CommandPalette({ onClose }) {
  const searchTabs = useTabStore((s) => s.searchTabs);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const results = query.trim() ? searchTabs(query) : [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      window.open(results[selectedIndex].url, '_blank', 'noopener');
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.command-palette-result');
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-input-wrapper">
          <Search className="command-palette-input-icon" size={20} />
          <input
            ref={inputRef}
            className="command-palette-input"
            type="text"
            placeholder="Search all tabs across workspaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="command-palette-hint">ESC</span>
        </div>

        <div className="command-palette-results" ref={resultsRef}>
          {query.trim() && results.length === 0 && (
            <div className="command-palette-no-results">
              No tabs found matching "{query}"
            </div>
          )}

          {!query.trim() && (
            <div className="command-palette-no-results">
              Type to search across all your tabs...
            </div>
          )}

          {results.map((result, index) => {
            let domain = '';
            try {
              domain = new URL(result.url).hostname.replace('www.', '');
            } catch {
              domain = result.url;
            }
            return (
              <div
                key={result.id}
                className={`command-palette-result ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => {
                  window.open(result.url, '_blank', 'noopener');
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <img
                  className="command-palette-result-icon"
                  src={result.favicon}
                  alt=""
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="command-palette-result-info">
                  <div className="command-palette-result-title">{result.title}</div>
                  <div className="command-palette-result-meta">
                    <span>{domain}</span>
                    <ArrowRight size={10} />
                    <span style={{ color: result.collectionColor }}>
                      {result.workspaceEmoji} {result.collectionName}
                    </span>
                  </div>
                </div>
                <ExternalLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>

        <div className="command-palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
