// Footer — always mounted in App shell. Renders on all views.

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      padding: 'var(--space-l) var(--space-m)',
      textAlign: 'center',
      background: 'var(--color-bg)',
      color: 'var(--color-text-dim)',
    }}>
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
        © 2025 Radian
      </span>
      <span style={{
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        color: 'var(--color-text-dim)',
        margin: '0 0.5em',
      }}>
        · Built with compass, straightedge, and Claude ·
      </span>
      <a
        href="https://github.com/fitore/radian-geometric-art"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View Radian source on GitHub (opens in new tab)"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'inherit',
          color: 'var(--color-text)',
          textDecoration: 'none',
          letterSpacing: '0.05em',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
        onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
      >
        GitHub ↗
      </a>
    </footer>
  );
}
