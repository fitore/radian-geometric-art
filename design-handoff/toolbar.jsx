/* global React */
const { useState, useRef, useEffect } = React;

// ---------- Popover filter tool (Variation B) ----------

window.FilterTool = function FilterTool({ group, active, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const n = active.length;

  let body;
  if (group.kind === 'symmetry') {
    body = (
      <div className="num-grid">
        {group.options.map(o => (
          <window.Chip key={o} small
            active={active.includes(o)}
            onClick={(e) => { e.stopPropagation(); onToggle(group.key, o); }}
          >{o}-fold</window.Chip>
        ))}
      </div>
    );
  } else if (group.kind === 'status') {
    body = (
      <div className="chips">
        {group.options.map(o => (
          <window.Chip key={o.v} dot={o.dot}
            active={active.includes(o.v)}
            onClick={(e) => { e.stopPropagation(); onToggle(group.key, o.v); }}
          >{o.l}</window.Chip>
        ))}
      </div>
    );
  } else if (group.kind === 'segmented') {
    body = (
      <window.Segmented
        options={group.options}
        value={active[0] || null}
        onChange={(v) => onToggle(group.key, v, true)}
      />
    );
  } else {
    body = (
      <div className="chips">
        {group.options.map(o => (
          <window.Chip key={o}
            active={active.includes(o)}
            onClick={(e) => { e.stopPropagation(); onToggle(group.key, o); }}
          >{o}</window.Chip>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="tool"
      data-active={n > 0 ? "true" : "false"}
      data-open={open ? "true" : "false"}
      onClick={() => setOpen(x => !x)}
    >
      <span>{group.label}</span>
      {n > 0 && <span className="n">{n}</span>}
      <window.Chev dir={open ? 'down' : 'down'} />
      <div className="pop" onClick={(e) => e.stopPropagation()}>
        {body}
      </div>
    </div>
  );
};
