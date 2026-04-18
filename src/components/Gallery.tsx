import type { Entry, ActiveFilters, PlaceholderEntry } from '../types.js';
import { PLACEHOLDER_ENTRIES } from '../data.js';
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

// ─── PlaceholderCard ──────────────────────────────────────────────────────────

function PlaceholderCard({ entry, index }: { entry: PlaceholderEntry; index: number }) {
  const cardBg = `var(--card-bg-${index % 6})`;

  const symTags  = entry.tags?.symmetry?.slice(0, 1) ?? [];
  const tradTags = entry.tags?.tradition?.slice(0, 1) ?? [];

  let subtitle: string | null = null;
  if (tradTags.length > 0 && symTags.length > 0) {
    subtitle = `${tradTags[0]} · ${symTags[0]}`;
  } else if (tradTags.length > 0) {
    subtitle = tradTags[0];
  } else if (symTags.length > 0) {
    subtitle = symTags[0];
  }

  return (
    <div
      className="card card--placeholder"
      aria-label={`Example entry: ${entry.title} by ${entry.artist.name}`}
    >
      <div className="card-img-wrap" style={{ background: cardBg }}>
        {entry.imageUrl ? (
          <img
            src={entry.imageUrl}
            alt={entry.title}
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
          />
        ) : null}
      </div>
      <div className="card-body">
        <div className="card-title">{entry.title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
        <a
          className="card-artist-credit"
          href={entry.artist.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${entry.artist.name}'s website (opens in new tab)`}
          onClick={e => e.stopPropagation()}
        >
          Photo: {entry.artist.name} ↗
        </a>
      </div>
    </div>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export function Gallery({ entries, activeFilters: _activeFilters, selectedId, totalCount, onSelect, onAddNew }: GalleryProps) {
  if (totalCount === 0) {
    return (
      <div className="gallery-outer" id="gallery">
        <div className="placeholder-banner">
          <div className="placeholder-banner-text">
            <p className="placeholder-banner-heading">Your collection is empty.</p>
            <p className="placeholder-banner-sub">Add your first piece to get started.</p>
            <p className="placeholder-banner-sub">Showing work from our practitioner community.</p>
          </div>
          <button className="btn btn--primary" onClick={onAddNew}>+ Add Entry</button>
        </div>
        <div className="gallery-grid">
          {PLACEHOLDER_ENTRIES.map((entry, i) => (
            <PlaceholderCard key={entry.id} entry={entry} index={i} />
          ))}
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
