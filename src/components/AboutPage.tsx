// About page — body content only. Header and footer are provided by the app shell.

export function AboutPage() {
  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto', padding: 'var(--space-xl) var(--space-l) var(--space-2xl)' }}>

      

      {/* Section: The Practice */}
      <section style={{ marginBottom: 'var(--space-xl)', fontFamily: 'var(--font-serif)',
          fontSize: '1.125rem',
          lineHeight: 1.7,
          color: 'var(--color-text-dim)',
          margin: 0, }}>
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
 <p>
        Sacred geometry is a discipline with deep roots across Islamic, Gothic, Celtic, Hindu,
        and nature-derived traditions. Practitioners draw these patterns by hand using compass
        and straightedge — the same tools used for a thousand years. The work is slow by
        design. Each pattern is a construction problem: a sequence of arcs and scaffold lines
        that builds toward a finished form through accumulated precision rather than freehand
        judgment. The constraint is the point. Working within it is the practice.
      </p>

      <p>
        The problem Radian addresses is a gap that exists at the intersection of encountering
        a pattern and being able to draw it. You find it on a mosque wall, a manuscript page,
        a photograph someone posted online. You can see it. You can describe it, roughly —
        six-fold, Islamic, probably compass-and-straightedge. What you cannot easily do is
        reconstruct it at your drafting table without already knowing how. Recognition and
        construction are different skills, and most available tools serve neither practitioner
        well. Radian is an attempt to close that gap.
      </p>
        
      </section>


      <hr style={{
        border: 'none',
        borderTop: '1px solid var(--color-border)',
        margin: 'var(--space-l) 0 var(--space-l) 0',
      }} />

      {/* Section: The Methodology */}
      <section style={{ marginBottom: 'var(--space-xl)', fontFamily: 'var(--font-serif)',
          fontSize: '1.125rem',
          lineHeight: 1.7,
          color: 'var(--color-text-dim)',
          margin: 0 }}>
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
          <p>The tool that helps a practitioner draw needs to think the way a practitioner thinks.</p>

      <p>
        Radian classifies geometric patterns using practitioner vocabulary: symmetry order,
        cultural tradition, construction method, mathematical proportions. Every result carries
        confidence scores and rationale. A wrong answer from a tool you trust is worse than no
        answer, so uncertain results say so.
      </p>

      <p>
        The deeper layer is mathematical. Radian detects the symmetry group of a pattern —
        dihedral Dn or cyclic Cn — and identifies the fundamental domain: the smallest wedge
        that generates the full pattern when the group operations are applied. For a
        practitioner, this answers the question that actually matters. What do I need to draw?
        The fundamental domain is the unit. Everything else is repetition.
      </p>

      <p>
        The symmetry detection pipeline has no existing library solution. Client-side symmetry
        detection of geometric patterns using practitioner vocabulary does not exist as an npm
        package. Radian assembles it from primitives: SVG vectorisation, point normalisation,
        KD-tree nearest-neighbour scoring across candidate fold counts, and a gap-threshold
        solution to the circle contamination problem — compass-and-straightedge drawings
        contain circular scaffold lines that score well at every fold count, and early versions
        returned incorrect results because of it. Calibration was iterative and data-driven.
        The first run on a clean D4 test image returned: Symmetry: low, none. The 800-point
        downsample was destroying signal. Early-exit logic was picking 6-fold (circles) instead
        of 4-fold (the actual pattern). Each fix was a targeted prompt with a verification
        checklist. Final result: 4-fold scoring 1.000, gap 0.085 against second-place 5-fold
        at 0.915. No guessing.
      </p>

      <p>
        Between the mathematics and the interface sits a translation layer. Symmetry group
        detection returns Dn and Cn values — precise, abstract, correct. Practitioners don't
        draw in symmetry group notation. They work in fold counts, cultural families,
        construction lineages. The ontology layer is a structured mapping between these two
        vocabularies: curated by hand, informed by the working language of the Grandi and
        Williamson traditions, and designed to produce results that feel recognisable to
        someone sitting at a drafting table. It is not a learned model. It is a deliberate set
        of associations, made explicit in the codebase and open to revision as the vocabulary
        matures.
      </p>

      <p>
        Spike results are published honestly in the repository: 55.5% overall classification
        accuracy across a 10-image ground-truth test set, with per-field breakdowns and a
        clear path to iteration. Analysis results are presented as suggested tags, not
        authoritative classifications. The methodology is designed to improve.
      </p>
        
      </section>

 <hr style={{
        border: 'none',
        borderTop: '1px solid var(--color-border)',
        margin: 'var(--space-l) 0 var(--space-l) 0',
      }} />

      {/* Section: How It Was Built */}
       <section style={{ marginBottom: 'var(--space-xl)', fontFamily: 'var(--font-serif)',
          fontSize: '1.125rem',
          lineHeight: 1.7,
          color: 'var(--color-text-dim)',
          margin: 0 }}>
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
        <p>
        Radian was built using three Claude tools, each assigned a distinct cognitive job.
        Claude.ai served as a planning partner at decision altitude — not for writing code, but
        for making good decisions before code gets written. This produced the architectural
        contracts: populateForm(entry) as the single integration point for all
        automated pipelines; the phasing strategy that validated Claude Vision accuracy before
        building in dependency order; the harness engineering framework; and the mathematics of
        symmetry group theory applied to pattern detection. The discipline enforced here: the
        thinking agent produces documents, not code. Every decision gets written down before
        implementation starts.
      </p>

      <p>
        Claude Design produced the visual language — the warm off-white palette, editorial
        typography, the card system, an aesthetic that feels like a practitioner's reference
        book rather than a SaaS dashboard. The design handoff was treated as a PR review before
        being applied. A deliberate gate, not a blind merge.
      </p>

      <p>
        Claude Code handled all implementation, operating from the repository with{" "}
        CLAUDE.md as its standing context. It receives scoped, well-specified
        prompts produced by the planning sessions. It does not make architectural decisions.
        It executes against contracts already defined. Every agent mistake becomes a new
        constraint in CLAUDE.md — not a note to be more careful, a mechanical
        prevention.
      </p>

      <p>
        During development, a planning prompt contained a TypeScript any cast.
        Claude Code caught the violation against the no-any rule in CLAUDE.md,
        self-corrected using an existing cast pattern already in the file, and proceeded. The
        harness caught a prompt error. That is the system working correctly.
      </p>

      <p>
        The repository is a teaching artifact as much as a product. CLAUDE.md is
        a governance document. architect.md carries domain knowledge the
        implementation agent reads before working on geometry features. The{" "}
        analysis/docs folder contains the PRD, technical brief, and spike plan —
        the decisions that preceded every line of code.
      </p>
      </section>
    </div>
  );
}
