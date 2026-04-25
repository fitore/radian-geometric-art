// Footer — rendered at the bottom of both the gallery view and the About page.
// Not sticky — scrolls with content.

interface FooterProps {
  onAbout: () => void;
}

export function Footer({ onAbout }: FooterProps) {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      padding: 'var(--space-l) var(--space-m)',
      textAlign: 'center',
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
      <button
        type="button"
        onClick={onAbout}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'inherit',
          color: 'var(--color-text)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textDecoration: 'none',
          letterSpacing: '0.05em',
        }}
        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
      >
        About
      </button>
    </footer>
  );
}
