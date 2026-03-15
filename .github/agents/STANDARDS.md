# STANDARDS.md — Code Standards

---

## TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- No `any`. If unavoidable, add a comment with reason and resolution path.
- Infer types from Zod schemas: `type T = z.infer<typeof schema>`
- API and Server Action responses use discriminated unions:
  `{ ok: true; data: T } | { ok: false; error: string }`
- Domain types live in `types/` — never inline in component files
- Server Action return types must be explicit; they cross the server/client boundary
- Use Next.js 16 typed route helpers: `PageProps`, `LayoutProps`

---

## Forms

React Hook Form + Zod. Schema first, types inferred, server re-validates.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name:  z.string().min(2).max(80),
});
type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="email">Email</label>
      <input id="email" {...register('email')} aria-describedby="email-error" />
      {errors.email && <p id="email-error" role="alert">{errors.email.message}</p>}
    </form>
  );
}
```

Every `<input>` needs: an `id`, an associated `<label>`, and `aria-describedby`
pointing to its error element. Client-side validation is UX. Server-side is
correctness — the same Zod schema runs in the Server Action.

---

## State Management

| Type | Tool |
|---|---|
| Remote server data | TanStack Query |
| Form state | React Hook Form |
| Local UI state | `useState` / `useReducer` |
| Shared UI state | React Context (scoped, not global) |
| URL / filter state | `nuqs` |

If you're syncing server data into `useState`, the architecture is wrong.

---

## Testing

Test the contract, not the implementation.

| Layer | Tool | Covers |
|---|---|---|
| Unit | Vitest | Business logic, Zod schemas, query factories, utilities |
| Component | RTL + jest-axe | Render behavior, interaction, accessibility |
| E2E | Playwright | Critical user journeys, form flows, navigation |

- Name tests as sentences: `it('disables submit when email is empty')`
- Use `userEvent`, never `fireEvent`
- Every interactive component gets a `jest-axe` check — no exceptions
- Bug found → write the failing test → then fix
- No snapshot tests unless explicitly requested

---

## Performance

Ship these without being asked:

- `next/image` for every image — explicit `width`/`height`, `priority` on above-fold LCP
- `next/font` at the root layout — never inside a component
- `dynamic({ ssr: false })` for Client Components with browser-only deps (maps, editors, charts)
- `<Suspense>` around every data-dependent subtree — the static shell renders first
- `'use client'` boundary as low as possible — Server Components don't ship JS

**Turbopack:** default in Next.js 16. ~19% faster cold builds in benchmarks but
can increase first-load JS per route due to different chunk splitting vs. Webpack.
Right default for prototyping; benchmark before committing to production.

---

## Dependency Evaluation

Before adding any dependency:

1. **Maintainer** — single maintainer is a risk, flag it
2. **Last release** — over 12 months inactive is a flag
3. **License** — MIT or Apache-2.0; anything else needs a note
4. **RSC-compatible?** — runtime CSS-in-JS can't run in Server Components
5. **Duplicate?** — justify if it overlaps something already in the stack

**Preferred choices:**

| Need | Default |
|---|---|
| Date handling | `date-fns` |
| Animation | Framer Motion — `dynamic()` import, client-only |
| Icons | `lucide-react` |
| Tables | TanStack Table |
| Charts | Recharts or Tremor |
| ORM | Prisma or Drizzle |
| Auth | Auth.js v5 |
| Email | Resend + React Email |
| Background jobs | Trigger.dev |
