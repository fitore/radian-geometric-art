# REFERENCES.md — Sources

Humans read this. Agents follow the other files.

---

## Framework & Tooling

- **Next.js 16 docs** — `nextjs.org/docs/app` — Cache Components, PPR, proxy.ts, typed routes
- **Next.js 16 release post** — `nextjs.org/blog/next-16` — caching model, Turbopack stable
- **Building Next.js for an Agentic Future** — `nextjs.org/blog/agentic-future` — Vercel's thinking on agents as first-class framework users; origin of DevTools MCP
- **Next.js AI Agents guide** — `nextjs.org/docs/app/guides/ai-agents` — configuring projects so agents use current docs instead of stale training data
- **TanStack Query — Advanced SSR** — `tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr` — prefetch, hydration, streaming with App Router
- **shadcn/ui changelog** — `ui.shadcn.com/docs/changelog` — track API changes; check before running `shadcn@latest`
- **Radix UI docs** — `radix-ui.com` — primitive APIs, ARIA specs, keyboard behavior

---

## Agent Skills

- **vercel-labs/agent-skills** — `github.com/vercel-labs/agent-skills` — official Vercel agent skills; `react-best-practices` has 62 rules across 8 categories ordered by impact
- **AGENTS.md (compiled)** — `github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/AGENTS.md` — the machine-readable rule document agents load; worth reading as a spec for what production React looks like at the architectural level
- **Introducing React Best Practices** — `vercel.com/blog/introducing-react-best-practices` — context on why the skill exists and what production problems it addresses

---

## Practitioners

**Lee Robinson** — `leerob.com` · `x.com/leerob`
Head of AI Education at Cursor; formerly VP of Developer Experience at Vercel (5 years).
Source for the complexity budget framing in ARCHITECT.md.
- [Coding Agents & Complexity Budgets](https://leerob.com/agents) — the primary reference for the JSX inlining principle and the CMS abstraction cost argument
- Migrated cursor.com from headless CMS to Markdown in 3 days with $260 of tokens and hundreds of parallel agents

**Addy Osmani** — `addyosmani.com` · `addyo.substack.com`
Engineering lead on Chrome DevX at Google. Most consistent practitioner writing on AI-augmented frontend development.
- [How Good Is AI at Coding React (Really)?](https://addyo.substack.com/p/how-good-is-ai-at-coding-react-really) — data-driven assessment of where agents succeed and fail on React specifically
- [The 80% Problem in Agentic Coding](https://addyo.substack.com/p/the-80-problem-in-agentic-coding) — most honest piece on where gains are going (more volume, not less work); greenfield vs. existing codebase differences
- [Coding for the Future Agentic World](https://addyo.substack.com/p/coding-for-the-future-agentic-world) — survey of Claude Code, Gemini CLI, Jules, async agent patterns
- [Conductors to Orchestrators](https://addyosmani.com/blog/future-agentic-coding/) — framing for sequential vs. parallel agent workflows

**Josh W. Comeau** — `joshwcomeau.com/react/`
Independent educator. Not writing about agents, but his React deep-dives are the
best reference material for understanding why patterns work — which matters when
encoding those patterns into agent instructions.

---

## Books

- **Designing Data-Intensive Applications** (Kleppmann) — cache semantics, system-of-record thinking, derived data; applies directly to why TanStack Query and Server Component fetch have distinct roles
- **Fundamentals of Software Architecture** (Richards & Ford) — coupling, cohesion, trade-offs; why every architectural characteristic costs another one
- **WCAG 2.1/2.2** — accessibility baseline; 4.5:1 text contrast, 3:1 UI elements, full keyboard navigation
