import type { Entry } from '../types.js';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EntryCardProps {
  entry: Entry;
  isSelected: boolean;
  onSelect: (id: string) => void;
  index: number;
}

// ─── Status → dot color ───────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  'want-to-try': 'var(--color-dot-blue)',
  'attempted':   'var(--color-dot-gold)',
  'done':        'var(--color-dot-green)',
};

// ─── EntryCard ────────────────────────────────────────────────────────────────

export function EntryCard({ entry, isSelected, onSelect, index }: EntryCardProps) {
  const dotColor = STATUS_DOT[entry.status] ?? 'var(--color-dot-grey)';
  const cardBg   = `var(--card-bg-${index % 6})`;

  const constructionTag = entry.tags?.constructionMethod?.[0];
  const symmetryTag     = entry.tags?.symmetry?.[0];
  const traditionTag    = entry.tags?.tradition?.[0];

  let subtitle: string | null = null;
  if (constructionTag || symmetryTag) {
    subtitle = [constructionTag, symmetryTag].filter(Boolean).join(' · ');
  } else if (traditionTag) {
    subtitle = traditionTag;
  }

  return (
    <div
      className={`card${isSelected ? ' selected' : ''}`}
      data-id={entry.id}
      onClick={() => onSelect(entry.id)}
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
        <div className="status-dot" style={{ background: dotColor }}></div>
        <div className="diff-badge">{entry.difficulty}</div>
        {entry.analysis && (
          <div className="analyzed-badge" title="Analyzed with Claude">✦</div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{entry.title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}
