# DESIGN-SYSTEM.md — Component Layer & Design Tokens

---

## Layer Model

```
Application
    ↓
shadcn/ui components      ← Owned source code in src/components/ui/
    ↓
Radix UI primitives       ← Accessible behavior: ARIA, keyboard, focus traps
    ↓
Tailwind CSS utilities    ← Styling and token application
    ↓
CSS custom properties     ← Design tokens
```

Never skip layers. Style Radix state through Tailwind data-attribute variants,
not arbitrary CSS: `data-[state=open]:rotate-180`.

---

## Design Tokens

Three tiers in `globals.css`. Components consume semantic tokens only —
never primitives directly.

```css
@import 'tailwindcss';

@theme {
  /* Tier 1: Primitive palette — palette only, never used in components */
  --color-blue-600:    oklch(48% 0.2 250);
  --color-neutral-50:  oklch(97% 0 0);

  /* Tier 2: Semantic — what components reference */
  --color-primary:     var(--color-blue-600);
  --color-surface:     var(--color-neutral-50);
  --color-foreground:  oklch(15% 0 0);

  /* Tier 3: Scale */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}

/* Theme switch: update semantic values only, never component files */
[data-theme='dark'] {
  --color-surface:     oklch(12% 0 0);
  --color-foreground:  oklch(95% 0 0);
}
```

---

## shadcn/ui Setup

```bash
pnpm dlx shadcn@latest init
# Choose: TypeScript, Tailwind CSS v4, src/app, CSS variables for colors

pnpm dlx shadcn@latest add button input dialog select combobox table
```

shadcn copies component source into `src/components/ui/`. You own this code —
review it, lint it, test it. Treat upgrades as a deliberate diff, not an npm bump.

---

## Component Authoring Pattern

```tsx
// src/components/ui/button.tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:     'border border-input bg-background hover:bg-accent',
        ghost:       'hover:bg-accent hover:text-accent-foreground',
        link:        'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-10 rounded-md px-8',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

Rules for every component:
- `cva` for variants — no manual ternary chains
- `cn()` for conditional class composition
- `asChild` via Radix `Slot` for polymorphic rendering
- Keyboard navigable and WCAG AA contrast (4.5:1 text, 3:1 UI elements) by default

---

## `cn()` Utility

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
