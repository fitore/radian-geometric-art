import type { Entry } from '../types.js';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EntryCardProps {
  entry: Entry;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// ─── Status class map ─────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  'want-to-try': 'want',
  'attempted':   'tried',
  'done':        'done',
};

// ─── EntryCard ────────────────────────────────────────────────────────────────

export function EntryCard({ entry, isSelected, onSelect }: EntryCardProps) {
  const statusClass = STATUS_CLASS[entry.status] ?? 'want';
  const symTags  = entry.tags?.symmetry?.slice(0, 1) ?? [];
  const tradTags = entry.tags?.tradition?.slice(0, 2) ?? [];
  const patTags  = entry.tags?.patternType?.slice(0, 1) ?? [];

  return (
    <div
      className={`card${isSelected ? ' selected' : ''}`}
      data-id={entry.id}
      onClick={() => onSelect(entry.id)}
    >
      <div className="card-img-wrap">
        {entry.imageUrl ? (
          <img
            src={entry.imageUrl}
            alt={entry.title}
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
          />
        ) : (
          <div className="card-no-image">◈</div>
        )}
        <div className="card-overlay"></div>
        <div className={`status-dot status-dot--${statusClass}`}></div>
        <div className="diff-badge">{entry.difficulty}</div>
        {entry.analysis && (
          <div className="analyzed-badge" title="Analyzed with Claude">✦</div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{entry.title}</div>
        <div className="card-tags">
          {symTags.map(t => <span key={t} className="card-tag card-tag--sym">{t}</span>)}
          {tradTags.map(t => <span key={t} className="card-tag">{t}</span>)}
          {patTags.map(t => <span key={t} className="card-tag">{t}</span>)}
        </div>
      </div>
    </div>
  );
}
