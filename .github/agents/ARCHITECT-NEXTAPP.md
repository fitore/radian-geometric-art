# ARCHITECT.md — Next.js 16 · App Router

> Agent entry point. Read this first, then follow the links.
> These are the defaults. Deviate only when a requirement makes a default wrong — say so when you do.

---

## Bootstrap

```bash
pnpm create next-app@latest my-app --typescript --tailwind --app --src-dir --turbopack
cd my-app
pnpm dlx shadcn@latest init
npx skills add vercel-labs/agent-skills
```

The third command installs Vercel's agent skills into `~/.claude/skills` or `.cursor/skills`.
62 React/Next.js performance rules load automatically during generation and review.

**Stack at a glance:**

| Concern | Default |
|---|---|
| Framework | Next.js 16 — App Router, `cacheComponents: true` |
| Language | TypeScript `strict` |
| Bundler | Turbopack (default, no config needed) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| URL state | `nuqs` |
| Testing | Vitest + RTL + Playwright |

---

## Three Questions — resolve before writing any file

1. **Server or client?** Default is Server Component. Add `'use client'` only for
   browser APIs, event handlers, or stateful hooks. Push the boundary down the tree.

2. **Server state or UI state?** API/database data belongs to TanStack Query or a
   Server Component fetch — never `useState`. UI state (open/closed, tab) belongs
   to `useState` or `useReducer`.

3. **Leaf or composition?** Leaves render data. Compositions arrange leaves.
   A component that both fetches and arranges is doing too much.

---

## Complexity Budget

Every abstraction costs the agent a slice of its ability to grep, read, and edit
the codebase. Anything behind a network boundary — a CMS API, a hosted auth UI,
a remote config service — is invisible to file tools.

**Before adding an abstraction, ask:** can the agent read and edit this with
standard file operations, or does it require a network call to see it?

| Abstraction | Cost | Default instead |
|---|---|---|
| Headless CMS | High — content behind API | MDX / `.md` files in repo |
| i18n | Medium — keys multiply surface area | One locale first |
| Hosted auth UI | Medium — redirect flows are opaque | Auth.js with local pages in `app/` |
| Zustand / Redux | Low–medium — adds indirection | `useState`, Context, or TanStack Query |

**JSX inlining:** prefer direct JSX over mapped arrays for small static lists.
Arrays add indirection the agent must trace. Inline JSX is greppable and editable
in one place. Copy-paste is better than the wrong abstraction. Extract at three
identical use cases, not two similar ones.

---

## File Generation Checklist

New route — always generate together:
```
app/[segment]/
├── page.tsx       Server Component, prefetch, passes props down
├── loading.tsx    Skeleton — required
├── error.tsx      Error boundary with reset() — required
└── actions.ts     If the route has mutations
```

New component — co-locate:
```
components/[feature]/
├── feature-name.tsx
├── feature-name.test.tsx   includes jest-axe
└── types.ts                if non-trivial types
```

---

## What Not to Do

- `useEffect` + `fetch` for data — use Server Components or TanStack Query prefetch
- `useState` for server data — it belongs in TanStack Query's cache
- Pages Router in a new project — App Router only
- Business logic in `app/` — routes orchestrate, logic lives in `lib/`
- `any` without a comment explaining why and when it resolves
- Raw `<img>` — always `next/image`
- Barrel exports from `components/ui/` — defeats tree-shaking
- Components that both fetch and arrange — one role each

---

## Further Reading

| File | When to read |
|---|---|
| `STRUCTURE.md` | Scaffolding a project or new route segment |
| `DATA.md` | Anything touching data fetching, caching, or mutations |
| `DESIGN-SYSTEM.md` | Building or modifying components |
| `STANDARDS.md` | TypeScript, forms, testing, performance, dependencies |
| `REFERENCES.md` | Sources behind the decisions in these files |
