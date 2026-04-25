// About page — placeholder for blog content. Three sections with headings and placeholder text.
// Full-page view; receives onBack to return to the gallery.

import { Footer } from './Footer.js';

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  return (
    <div className="app" style={{ minHeight: '100vh' }}>

      {/* Back navigation */}
      <nav style={{ padding: 'var(--space-m) var(--space-l)' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '0.9375rem',
            color: 'var(--color-text-dim)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-dim)')}
        >
          ← Back to collection
        </button>
      </nav>

      {/* Content — max 42rem, centred */}
      <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '0 var(--space-l) var(--space-2xl)' }}>

        {/* Wordmark */}
        <div style={{ marginBottom: 'var(--space-l)' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            letterSpacing: '0.2em',
            color: 'var(--color-text)',
            marginBottom: '0.25rem',
          }}>
            RADIAN
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '1rem',
            color: 'var(--color-text-dim)',
          }}>
            Where Art and Mathematics Unite
          </div>
        </div>

        <hr style={{
          border: 'none',
          borderTop: '1px solid var(--color-border)',
          margin: '0 0 var(--space-xl)',
        }} />

        {/* Section: The Practice */}
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            margin: '0 0 var(--space-m)',
          }}>
            The Practice
          </h2>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.125rem',
            lineHeight: 1.7,
            color: 'var(--color-text-dim)',
            margin: 0,
          }}>
            Content coming — this section will describe the sacred geometry drawing practice:
            compass and straightedge, the meditative quality of construction, and what it means
            to work within the constraints of classical geometry.
          </p>
        </section>

        {/* Section: The Methodology */}
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            margin: '0 0 var(--space-m)',
          }}>
            The Methodology
          </h2>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.125rem',
            lineHeight: 1.7,
            color: 'var(--color-text-dim)',
            margin: 0,
          }}>
            Content coming — this section will describe the research and classification methodology:
            how patterns are identified, tagged, and catalogued, and the role of symmetry group
            analysis in understanding geometric structures.
          </p>
        </section>

        {/* Section: How It Was Built */}
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            margin: '0 0 var(--space-m)',
          }}>
            How It Was Built
          </h2>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.125rem',
            lineHeight: 1.7,
            color: 'var(--color-text-dim)',
            margin: 0,
          }}>
            Content coming — this section will describe the development process: building Radian
            as a demonstration of disciplined AI-assisted software development, the harness
            structure, and what this project teaches about human–AI collaboration.
          </p>
        </section>

        <hr style={{
          border: 'none',
          borderTop: '1px solid var(--color-border)',
          margin: '0 0 var(--space-l)',
        }} />

      </div>

      <Footer onAbout={() => { /* already on About page — no-op */ }} />

    </div>
  );
}
