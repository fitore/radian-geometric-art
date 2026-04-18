/* global React */
const { useState, useMemo } = React;

// ---------- Primitives ----------

window.Chip = function Chip({ active, onClick, dot, children, small }) {
  return (
    <button
      className={"chip" + (small ? " small" : "")}
      aria-pressed={active ? "true" : "false"}
      onClick={onClick}
    >
      {dot && <span className="dot" style={{ background: dot }} />}
      {children}
    </button>
  );
};

window.Segmented = function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map(o => (
        <button
          key={o}
          role="radio"
          aria-pressed={value === o ? "true" : "false"}
          onClick={() => onChange(value === o ? null : o)}
        >{o}</button>
      ))}
    </div>
  );
};

window.Chev = function Chev({ dir = 'down' }) {
  const r = dir === 'down' ? 0 : dir === 'right' ? -90 : 90;
  return (
    <svg className="chev" width="10" height="10" viewBox="0 0 10 10"
         style={{ transform: `rotate(${r}deg)` }}>
      <path d="M1 3 L5 7 L9 3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
};

// ---------- Filter group (accordion) ----------

window.FilterGroup = function FilterGroup({ group, active, onToggle, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  React.useEffect(() => { setOpen(defaultOpen); }, [defaultOpen]);

  const n = active.length;

  let body;
  if (group.kind === 'segmented') {
    body = (
      <Segmented
        options={group.options}
        value={active[0] || null}
        onChange={(v) => onToggle(group.key, v, true)}
      />
    );
  } else if (group.kind === 'symmetry') {
    body = (
      <div className="num-grid">
        {group.options.map(o => (
          <Chip key={o} small
            active={active.includes(o)}
            onClick={() => onToggle(group.key, o)}
          >{o}-fold</Chip>
        ))}
      </div>
    );
  } else if (group.kind === 'status') {
    body = (
      <div className="group-body">
        {group.options.map(o => (
          <Chip key={o.v}
            active={active.includes(o.v)}
            dot={o.dot}
            onClick={() => onToggle(group.key, o.v)}
          >{o.l}</Chip>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="group-body">
        {group.options.map(o => (
          <Chip key={o}
            active={active.includes(o)}
            onClick={() => onToggle(group.key, o)}
          >{o}</Chip>
        ))}
      </div>
    );
  }

  return (
    <div className="group" data-open={open ? "true" : "false"}>
      <button className="group-head" onClick={() => setOpen(x => !x)}>
        <span className="lbl">{group.label}</span>
        {n > 0 && <span className="count">{n}</span>}
        <Chev dir={open ? 'down' : 'right'} />
      </button>
      {body}
    </div>
  );
};

// ---------- Active filters bar ----------

window.ActiveBar = function ActiveBar({ groups, active, onToggle, onClear }) {
  const pills = [];
  groups.forEach(g => {
    (active[g.key] || []).forEach(v => {
      let label = v;
      if (g.kind === 'symmetry') label = `${v}-fold`;
      if (g.kind === 'status') {
        const o = g.options.find(x => x.v === v); if (o) label = o.l;
      }
      pills.push({ key: g.key + ':' + v, label, gkey: g.key, val: v });
    });
  });
  if (!pills.length) return null;
  return (
    <div className="active-bar" role="region" aria-label="Active filters">
      <span className="label">Filters</span>
      {pills.map(p => (
        <span key={p.key} className="pill">
          {p.label}
          <button className="x" aria-label={`Remove ${p.label}`}
            onClick={() => onToggle(p.gkey, p.val)}>
            <svg width="8" height="8" viewBox="0 0 8 8">
              <path d="M1 1 L7 7 M7 1 L1 7" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
          </button>
        </span>
      ))}
      <button className="clear" onClick={onClear}>Clear all</button>
    </div>
  );
};

Object.assign(window, { Chip: window.Chip, Segmented: window.Segmented, Chev: window.Chev, FilterGroup: window.FilterGroup, ActiveBar: window.ActiveBar });
