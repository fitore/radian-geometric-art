import type { Entry, ActiveFilters } from '../types.js';
import { EntryCard } from './EntryCard.js';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GalleryProps {
  entries: Entry[];            // already filtered and sorted by the caller
  activeFilters: ActiveFilters;
  selectedId: string | null;
  totalCount: number;          // unfiltered count, to determine empty-state variant
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export function Gallery({ entries, activeFilters: _activeFilters, selectedId, totalCount, onSelect, onAddNew: _onAddNew }: GalleryProps) {
  if (entries.length === 0 && totalCount === 0) {
    return (
      <div className="gallery-grid" id="gallery">
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <div className="empty-title">Your collection is empty</div>
          <div className="empty-sub">Add your first piece to get started</div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="gallery-grid" id="gallery">
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <div className="empty-title">No pieces match your filters</div>
          <div className="empty-sub">Try clearing some filters or adjusting your search</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-grid" id="gallery">
      {entries.map((entry, i) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          index={i}
          isSelected={entry.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
