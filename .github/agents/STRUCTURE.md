# STRUCTURE.md — Project Layout & Routing

---

## Directory Layout

```
src/
├── app/                          # Routes only — no business logic
│   ├── layout.tsx                # Root layout: providers, fonts, metadata
│   ├── page.tsx                  # Homepage
│   ├── not-found.tsx             # Global 404
│   ├── (marketing)/              # Route group — no URL effect
│   │   └── about/page.tsx
│   ├── (app)/                    # Authenticated shell
│   │   ├── layout.tsx            # App chrome: sidebar, nav
│   │   └── dashboard/
│   │       ├── page.tsx          # Server Component — prefetch point
│   │       ├── loading.tsx       # Suspense fallback
│   │       └── error.tsx         # Error boundary
│   └── api/                      # Route Handlers only (webhooks, OAuth callbacks)
│
├── components/
│   ├── ui/                       # Design system — shadcn-generated, then owned
│   ├── [feature]/                # Feature-scoped components
│   └── shared/                   # Cross-feature: PageHeader, EmptyState, etc.
│
├── lib/
│   ├── api/                      # Typed fetch wrappers, service clients
│   ├── query/                    # TanStack Query factories
│   └── utils.ts                  # cn(), formatters, shared utilities
│
├── hooks/                        # Custom React hooks
├── types/                        # Shared TypeScript interfaces and domain types
└── styles/
    └── globals.css               # Tailwind base + CSS custom properties
```

---

## Rules

- `app/` is for routing only. Pages call functions from `lib/` and pass results
  to components. No inline fetch calls, no business rules, no component logic.
- Co-locate by feature, not by type. A feature's component, hook, and types live
  together under `components/[feature]/`.
- A component used in two or more features moves to `components/shared/`.
- Never barrel-export from `components/ui/`. Named imports keep tree-shaking clean
  and make dependencies traceable.
- Every `page.tsx` that fetches data gets a `loading.tsx` and an `error.tsx`
  generated alongside it. No exceptions.

---

## Routing Conventions

**Route groups** `(name)` — apply a layout without affecting the URL. Use for
distinct shells: `(marketing)`, `(app)`, `(auth)`.

**Parallel routes** `@slot` — independently loading panels within a shared layout.
Use for dashboards where two data-fetching subtrees should not block each other.
High cognitive overhead — use sparingly.

**Intercepting routes** `(.)` — a route that renders as a modal when accessed
from within the app, but as a full page when navigated to directly. Use for
image lightboxes, detail drawers, and confirmation dialogs.

**`proxy.ts`** — replaces `middleware.ts` in Next.js 16. Use for redirects, locale
detection, and edge routing. Not an authorization layer — verify auth in the Server
Component or Route Handler that accesses the data.
