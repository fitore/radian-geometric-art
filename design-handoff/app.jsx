/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

// ---------- Placeholder art (SVG backgrounds that look like geometric pieces) ----------

function placeholderBG(seed, hue) {
  // Generate a subtle geometric placeholder using CSS gradients
  const h = hue;
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
    <defs>
      <radialGradient id='g' cx='50%' cy='50%' r='65%'>
        <stop offset='0%' stop-color='oklch(0.88 0.06 ${h})'/>
        <stop offset='100%' stop-color='oklch(0.78 0.05 ${h})'/>
      </radialGradient>
    </defs>
    <rect width='400' height='400' fill='url(#g)'/>
    <g stroke='oklch(0.40 0.05 ${h})' stroke-width='0.8' fill='none' opacity='0.55'>
      ${Array.from({length: seed % 3 + 8}).map((_,i) => {
        const r = 40 + i * 18;
        return `<circle cx='200' cy='200' r='${r}'/>`;
      }).join('')}
      ${Array.from({length: 12}).map((_,i) => {
        const a = (i * Math.PI) / 6;
        const x = 200 + Math.cos(a) * 180;
        const y = 200 + Math.sin(a) * 180;
        return `<line x1='200' y1='200' x2='${x}' y2='${y}'/>`;
      }).join('')}
      <polygon points='${Array.from({length: 8}).map((_,i) => {
        const a = (i * Math.PI) / 4 + (seed * 0.2);
        return `${200 + Math.cos(a) * 110},${200 + Math.sin(a) * 110}`;
      }).join(' ')}'/>
      <polygon points='${Array.from({length: 8}).map((_,i) => {
        const a = (i * Math.PI) / 4 + (seed * 0.2) + Math.PI/8;
        return `${200 + Math.cos(a) * 70},${200 + Math.sin(a) * 70}`;
      }).join(' ')}'/>
    </g>
  </svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// ---------- Gallery ----------

const STATUS_DOTS = { want:'#3b6fb0', attempted:'#a88338', done:'#4d8555' };

window.Gallery = function Gallery({ pieces }) {
  return (
    <div className="grid">
      {pieces.map((p, i) => (
        <article key={p.id} className="card">
          <div className="img" style={{
            backgroundImage: placeholderBG(p.id * 7, (p.id * 47) % 360)
          }}>
            <span className="dot" style={{ background: STATUS_DOTS[p.status] || '#999' }} />
            <span className="level">{p.level}</span>
          </div>
          <div className="body">
            <h3 className="title">{p.title}</h3>
            <div className="sub">{p.sub}</div>
          </div>
        </article>
      ))}
    </div>
  );
};

// ---------- Main App ----------

function countActive(active) {
  return Object.values(active).reduce((n, arr) => n + (arr?.length || 0), 0);
}

window.App = function App({ variation, allExpanded }) {
  const { groups, pieces } = window.RADIAN_DATA;
  const [active, setActive] = useState(window.RADIAN_DATA.active);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const settingsRef = React.useRef(null);

  React.useEffect(() => {
    function onDoc(e){
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = (gkey, val, single) => {
    setActive(a => {
      const cur = a[gkey] || [];
      let next;
      if (single) next = (val == null) ? [] : [val];
      else if (cur.includes(val)) next = cur.filter(x => x !== val);
      else next = [...cur, val];
      return { ...a, [gkey]: next };
    });
  };
  const clearAll = () => setActive(Object.fromEntries(groups.map(g => [g.key, []])));

  const activeCount = countActive(active);

  const Rail = (
    <>
      {groups.map(g => (
        <window.FilterGroup
          key={g.key}
          group={g}
          active={active[g.key] || []}
          onToggle={toggle}
          defaultOpen={allExpanded}
        />
      ))}
      {activeCount > 0 && (
        <div style={{
          marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--hair-soft)'
        }}>
          <button className="sort" onClick={clearAll} style={{width:'100%'}}>
            Clear all filters · {activeCount}
          </button>
        </div>
      )}
    </>
  );

  const Toolbar = (
    <div className="toolbar">
      {groups.map(g => (
        <window.FilterTool
          key={g.key}
          group={g}
          active={active[g.key] || []}
          onToggle={toggle}
        />
      ))}
      {activeCount > 0 && (
        <button className="sort" onClick={clearAll}>
          Clear · {activeCount}
        </button>
      )}
    </div>
  );

  return (
    <div className="app">
      {/* ============ TOP BAR ============ */}
      <header className="topbar">
        <div className="brand">
          <button className="nav-back" aria-label="Back">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M7 1 L3 5 L7 9" fill="none" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          </button>
          <span className="wordmark">RADIAN</span>
        </div>
        <span className="tag">Where art and mathematics unite</span>
        <div className="spacer" />
        <div
          ref={settingsRef}
          className="tool header-tool"
          data-open={settingsOpen ? "true" : "false"}
          onClick={() => setSettingsOpen(x => !x)}
        >
          <span>Settings</span>
          <window.Chev dir="down" />
          <div className="pop pop-menu" onClick={(e) => e.stopPropagation()}>
            <button className="menu-item" onClick={() => setDark(d => !d)}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M10 7.5 A4.5 4.5 0 1 1 4.5 2 A3.5 3.5 0 0 0 10 7.5 Z"/>
              </svg>
              Dark mode
              {dark && <span className="chk">on</span>}
            </button>
            <div className="sep" />
            <button className="menu-item">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 8 L6 2 M3.5 4.5 L6 2 L8.5 4.5 M2 10 L10 10"/>
              </svg>
              Import
            </button>
            <button className="menu-item">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2 L6 8 M3.5 5.5 L6 8 L8.5 5.5 M2 10 L10 10"/>
              </svg>
              Export
            </button>
          </div>
        </div>
        <button className="tool header-tool header-tool--primary">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M6 2 L6 10 M2 6 L10 6"/>
          </svg>
          <span>Add piece</span>
        </button>
      </header>

      {/* ============ MAIN ============ */}
      <div className="main">
        {variation === 'A' && (
          <aside className="rail">{Rail}</aside>
        )}
        {variation === 'B' && (
          <aside className="rail" style={{ display: 'none' }} />
        )}

        <section className="gallery-wrap" style={
          variation === 'B' ? { gridColumn: '1 / -1' } : undefined
        }>
          <div className="gallery-head">
            <span className="count">
              Your collection — <b>{pieces.length} pieces</b>
            </span>
            <span className="spacer" />
            <label className="search">
              <svg width="12" height="12" viewBox="0 0 12 12" style={{opacity:.5, marginRight:6}}>
                <circle cx="5" cy="5" r="3" fill="none" stroke="currentColor"/>
                <path d="M7.5 7.5 L11 11" stroke="currentColor" fill="none"/>
              </svg>
              <input placeholder="Search…" />
            </label>
            <button className="sort">Newest first ↓</button>
          </div>

          {variation === 'B' && Toolbar}

          <window.ActiveBar
            groups={groups}
            active={active}
            onToggle={toggle}
            onClear={clearAll}
          />

          <window.Gallery pieces={pieces} />
        </section>
      </div>

      {/* ============ Mobile drawer ============ */}
      <button className="filter-fab" onClick={() => setDrawerOpen(true)}>
        Filters
        {activeCount > 0 && <span className="n">{activeCount}</span>}
      </button>
      <div className={"drawer-scrim" + (drawerOpen ? " open" : "")}
           onClick={() => setDrawerOpen(false)} />
      <aside className={"drawer" + (drawerOpen ? " open" : "")}>
        <div className="handle" />
        <div className="head">
          <h3>Filters</h3>
          {activeCount > 0 && (
            <span style={{
              fontFamily:'var(--font-ui)', fontSize:11, color:'var(--gold-ink)',
              letterSpacing:'.08em'
            }}>{activeCount} active</span>
          )}
          <button className="close" onClick={() => setDrawerOpen(false)}>Done</button>
        </div>
        {groups.map(g => (
          <window.FilterGroup
            key={g.key}
            group={g}
            active={active[g.key] || []}
            onToggle={toggle}
            defaultOpen={true}
          />
        ))}
        {activeCount > 0 && (
          <button className="sort" onClick={clearAll}
            style={{width:'100%', marginTop:16}}>
            Clear all filters
          </button>
        )}
      </aside>
    </div>
  );
};
