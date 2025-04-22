# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build: `pnpm build`
- Dev: `pnpm dev`
- Electron Dev: `pnpm electron:dev`
- TypeCheck: `pnpm typecheck`
- Lint/Format: `pnpm check` (view only), `pnpm check:write` (fix)
- DB: `pnpm db:push`, `pnpm db:studio`

## Style Guidelines
- Use Biome for formatting and linting
- Organize imports (automatically handled by Biome)
- Strict TypeScript - use proper typing with no unchecked indexed access
- React: Use functional components with TypeScript
- Use path alias `@/` to import from `src/`
- Use tailwind with `cn()` util from `@/lib/utils` for className composition
- Follow existing component patterns in `/components`
- Use Zod for schema validation and type safety
- Use descriptive file naming in kebab-case
- Prefer `const` over `let` when variables don't change