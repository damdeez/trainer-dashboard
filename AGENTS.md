<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Code style

- **Component props: `interface`, not `type`.** Declare props as
  `interface FooProps { ... }`, not a type alias.
- **Guard clauses, always braced.** Return early to avoid nesting:
  `if (!client) { return null }`. Never write brace-less inline statements
  (`if (x) return null` / `if (x) doThing()`) — every `if` body gets braces on
  its own line.
- **Semantic HTML, no div soup.** Reach for the element that means what you
  intend (`button`, `nav`, `header`, `main`, `section`, `ul`/`li`, `form`,
  `label`, …) before falling back to `div`/`span`.
- **Declare before use.** Never reference a function or component above its
  declaration (don't lean on hoisting). Define helper components first, then
  the component that renders them — e.g. in `ChatPanel.tsx`, `ChatBubble` and
  `ChatSkeleton` come before `ChatPanel`.
- **Render components as JSX, not function calls.** Always `<Example />`, never
  `Example()`. Calling a component as a plain function breaks hooks and
  reconciliation.
- **All hooks live in a `hooks/` folder.** Custom hooks (anything `use*`) go in
  `src/lib/hooks/`, one concern per file — not inline in component files. Name
  hook files in camelCase after the hook itself: `useExample.ts` (not
  `use-example.ts`). Don't add a hook that's just a thin wrapper around another
  hook — call the underlying hook directly.

# React

This project runs **React 19 with the React Compiler enabled**
(`reactCompiler: true` in `next.config.ts`, via `babel-plugin-react-compiler`).
The compiler auto-memoizes components and hooks, so treat manual memoization as
unnecessary.

Follow the official guidance — read these before writing component logic:

- **Rules of React** — https://react.dev/reference/rules
  Components and hooks must be pure (idempotent render, no side effects during
  render, no mutation of props/state/args); call hooks only at the top level;
  never call components as functions. Purity is also what lets the compiler
  memoize safely — breaking these rules breaks the compiler.
- **You Might Not Need an Effect** — https://react.dev/learn/you-might-not-need-an-effect
  Don't use `useEffect` to transform data for rendering (compute it during
  render), to reset or adjust state on prop changes (use `key` or compute
  during render), or to handle user events (do it in the handler). Reserve
  effects for synchronizing with external systems; prefer `useSyncExternalStore`
  for external stores (see `src/lib/hooks/useMediaQuery.ts`).
- **No manual memoization.** With the compiler on, don't reach for `useMemo`,
  `useCallback`, or `memo` — compute derived values inline during render and let
  the compiler handle it.
