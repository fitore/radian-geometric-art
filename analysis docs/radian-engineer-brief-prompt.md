# Radian v2 — Principal Engineer Technical Brief Prompt

**Paste this into a new chat. Attach both files listed below.**

---

## Attachments required

1. `radian-v2-PRD.md` — The full product requirements document
2. `radian-vision-spike.md` — The Vision analysis spike plan and test protocol

---

## Prompt

You are a principal engineer reviewing a product requirements document before any code is written. The project is **Radian**, a sacred geometry collection app being extended with AI-powered search, pattern analysis, line template extraction, construction sequence generation, a practice journal, and camera capture.

Two documents are attached:

1. **The v2 PRD** — an intentionally ambitious, undescoped product spec covering six features. The PM explicitly left phasing, feasibility boundaries, and architectural decisions to engineering. Section 18 lists ten specific decisions that are yours to make.
2. **The Vision Analysis Spike** — a test plan for validating Claude Vision's geometric pattern classification accuracy, including the system prompt, test protocol, scoring rubric, and edge detection feasibility assessment.

Your job is to produce a **technical brief** — the document that sits between the PRD and the build plan. It translates product ambition into engineering reality. It is not a project plan with dates. It is the architectural and feasibility assessment that makes a project plan possible.

---

## What the technical brief must contain

### 1. Architecture Assessment

Read the PRD's existing v1 architecture (Section 3) and the proposed v2 file structure (Section 16). Then decide:

- **File structure**: Is the proposed `js/` directory split correct, or would you organize differently? Justify your answer in terms of dependency graph and load order.
- **State management**: The app currently uses in-memory JS variables synced to localStorage. With v2's expanded schema (analysis metadata, template data URIs, attempt objects, search history), does this model hold? Where does it break? What's the minimum viable change?
- **API layer design**: The PRD describes four distinct system prompts for four capabilities. Should these be four separate functions with shared infrastructure, or a single `callClaude(capability, payload)` dispatcher? What's the error handling contract?
- **Storage migration**: The PRD flags localStorage limits and mentions IndexedDB as a future option. Make the call: stay on localStorage with export as a relief valve, or migrate now. Justify with estimated storage consumption for a collection of 50 entries with templates and 20 practice attempts with photos.

### 2. Feasibility Assessment — Feature by Feature

For each of the six features in the PRD, provide:

- **Feasibility rating**: Proven / Likely / Uncertain / Risky
- **Key technical risk**: The single thing most likely to cause the feature to underperform or fail
- **Dependency chain**: What must exist before this feature can be built
- **Estimated complexity**: S / M / L / XL with a one-line rationale
- **Descope lever**: If this feature takes twice as long as expected, what's the minimum viable version that still delivers value

The six features are:
1. Tag-Driven Inspiration Search (PRD Section 5)
2. Pattern Analysis with Claude Vision (PRD Section 6)
3. Line Template Extraction (PRD Section 7)
4. Construction Sequence Generation (PRD Section 8)
5. Visual Similarity Search (PRD Section 9)
6. Practice Journal (PRD Section 10)
7. Camera Capture (PRD Section 11)

(Yes, that's seven — the PRD lists camera capture separately. Assess it.)

### 3. The Ten Decisions

Section 18 of the PRD lists ten architectural decisions explicitly deferred to engineering. Answer each one with your recommendation and a one-paragraph rationale. Don't hedge — make a call, and if you're wrong, say what would change your mind.

The ten decisions:
1. Build order and phasing
2. Single-call vs. multi-call API architecture
3. OpenCV.js vs. vanilla Canvas for edge detection
4. SVG export feasibility
5. Construction sequence visualization approach
6. Mobile responsiveness scope
7. IndexedDB migration timing
8. Model selection (Sonnet vs. Opus per feature)
9. Rate limiting and batching strategy
10. Prompt versioning strategy

### 4. Build Phases

Based on your feasibility assessment and the ten decisions, propose a phased build plan. For each phase:

- **Phase name and scope**: What ships and what doesn't
- **Prerequisites**: What must be true before this phase starts (including spike results)
- **Deliverables**: What exists at the end of this phase that didn't exist before
- **Acceptance criteria**: How we know the phase is done (concrete, testable)
- **Risk register**: The 1-2 things most likely to blow up this phase, and the mitigation

Structure the phases so that each one produces a usable, demoable increment. No phase should end with "infrastructure built but nothing visible."

### 5. Schema Decisions

The PRD proposes extending the entry object with `analysis`, `source`, `template`, `construction`, and `attempts` fields (Section 4). Review this schema and:

- Flag any fields that are redundant, misplaced, or likely to cause issues
- Identify any missing fields you'd need that the PRD didn't anticipate
- Propose the migration strategy: how do v1 entries (without these fields) coexist with v2 entries? Does the app need a migration function, or can it use optional field access (`entry.analysis?.performedAt`)?
- Decide whether `attempts` should be nested inside the entry object or stored as separate top-level objects with a foreign key. Justify with storage and query implications.

### 6. API Cost Model

The PRD mentions per-call cost estimates (Section 14). Build a more rigorous model:

- Estimate input/output tokens per API call type (search, analysis, construction, similarity)
- Calculate cost per operation at current Sonnet pricing
- Model the monthly cost for a "typical practitioner" usage pattern: 10 searches, 15 analyses, 5 construction sequences, 20 template extractions per month
- Identify where costs could surprise us (e.g., large images increasing input tokens, construction prompts requiring extended thinking)
- Recommend whether to surface cost tracking in the UI (the PRD suggests it) or whether that adds anxiety without actionable value

### 7. Spike Integration

Review the Vision Analysis Spike document and:

- Confirm or challenge the decision thresholds (≥70% greenlight, 50-70% iterate, <50% descope)
- Identify anything the spike should test that it currently doesn't
- Propose how spike results flow into the build plan — specifically, what changes in your phasing if the spike comes back at 55% vs. 80%
- Flag any prompt engineering risks the spike doesn't address

### 8. CLAUDE.md Draft

Write the updated CLAUDE.md for the v2 project. This is the file that sits in the project root and tells Claude Code how to work on this codebase. It must cover:

- Architecture rules (updated for multi-file structure)
- File responsibilities and dependency order
- Key contracts (`populateForm()`, API layer functions, canvas pipeline)
- Things Claude Code must never do (break `populateForm()`, inline API keys, add npm dependencies)
- Testing expectations per phase

---

## Rules for this brief

- **Be opinionated.** The PM wrote an ambitious PRD and explicitly said "engineering decides." Decide. If you think a feature should be cut entirely, say so and explain why.
- **Be concrete.** "This might be hard" is not useful. "This requires contour tracing which has no vanilla JS library under 50KB, so we either accept 8MB of OpenCV.js or write a simplified tracer that handles convex shapes only" is useful.
- **Name the tradeoffs.** Every architectural decision is a tradeoff. State what you're gaining AND what you're giving up.
- **Preserve the contracts.** The `populateForm()` integration pattern is the backbone of this system. Every feature flows through it. Do not propose alternatives that break this contract.
- **Reference the spike.** Your phasing should depend on spike results. State what you'd do differently at each accuracy threshold.
- **Write for a PM who reads code.** The person receiving this brief understands architecture, reads JavaScript, and will push back on hand-waving. Show your reasoning.
