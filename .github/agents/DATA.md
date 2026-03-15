# DATA.md — Data Fetching, Caching & Mutations

---

## Server vs. Client Components

**Default: Server Component.** Start every file without `'use client'`.

| Use Server Components for | Use Client Components for |
|---|---|
| Data fetching (DB, internal API, env vars) | Browser APIs (`window`, `localStorage`) |
| Content that needs no interactivity | Event handlers, form interaction |
| Code that must not ship to the browser | `useState`, `useEffect`, `useRef` |
| | Libraries that assume a browser runtime |

**The boundary pattern:** Server Component fetches, passes props to a Client
Component that handles interaction. Never reverse this.

```tsx
// app/(app)/dashboard/page.tsx — Server Component
export default async function DashboardPage() {
  const data = await getDashboardData(); // runs on server, lib/api call
  return <DashboardClient data={data} />;
}

// components/dashboard/dashboard-client.tsx
'use client';
export function DashboardClient({ data }: { data: DashboardData }) {
  const [selected, setSelected] = useState(null);
}
```

Push `'use client'` as far down the tree as possible. Each Server Component that
stays on the server is JavaScript that does not ship to the browser.

---

## Caching — Next.js 16 Cache Components

Enable in `next.config.ts` for every project:

```ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = { cacheComponents: true };
export default nextConfig;
```

This activates Partial Prerendering (PPR) and the `use cache` directive. At build
time, Next.js renders a static HTML shell. Components inside `<Suspense>` stream
at request time; anything marked `use cache` is included in the shell.
The old SSG vs. SSR decision is gone — the boundary is now per-component.

```tsx
import { Suspense } from 'react';

export default function ProductPage() {
  return (
    <>
      <ProductHeader />                        {/* → static shell */}
      <Suspense fallback={<CartSkeleton />}>
        <UserCart />                           {/* → streams at request time */}
      </Suspense>
    </>
  );
}
```

Place `<Suspense>` boundaries close to the components that need them. Everything
outside a boundary is precompiled into the static shell.

---

## Server Actions — mutations

Prefer Server Actions over client-side fetch for all writes.

```ts
// app/(app)/items/actions.ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({ name: z.string().min(1) });

export async function createItem(formData: FormData) {
  const parsed = schema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() } as const;
  await db.item.create({ data: parsed.data });
  revalidatePath('/items');
  return { ok: true } as const;
}
```

Every Server Action must:
- Validate input with Zod
- Return a typed discriminated result: `{ ok: true; data: T } | { ok: false; error: E }`
- Never return `void`

---

## TanStack Query — interactive client state

Use TanStack Query when Client Components need: optimistic updates, background
refetch, polling, cursor pagination, or dependent queries driven by user interaction.
It complements Server Components — do not use one to replace the other.

**Query factories** in `lib/query/` keep keys consistent between server prefetch
and client `useQuery`:

```ts
// lib/query/items.ts
import type { UseQueryOptions } from '@tanstack/react-query';

export const itemsQuery = (): UseQueryOptions<Item[]> => ({
  queryKey: ['items'],
  queryFn: () => fetch('/api/items').then(r => r.json()),
  staleTime: 30_000,
});
```

**Prefetch on the server, consume on the client:**

```tsx
// app/(app)/items/page.tsx — Server Component
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { itemsQuery } from '@/lib/query/items';

export default async function ItemsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(itemsQuery());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ItemsList />   {/* Client Component — useQuery finds data already cached */}
    </HydrationBoundary>
  );
}
```

The user sees no loading state on the initial render. TanStack Query handles
background refetch, invalidation, and optimistic updates from there.
