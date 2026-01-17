# Change: Rename VibeScore to VibeUsage (brand + interfaces)

## Why
We are rebranding the product to **VibeUsage** and moving all public identifiers (domain, CLI, packages, API paths, docs) to the new name while keeping a 90-day compatibility window to avoid breaking existing users.

## What Changes
- **BREAKING (with 90-day compatibility):** Public API/Edge Function paths move from `vibescore-*` to `vibeusage-*`.
- **BREAKING (with 90-day compatibility):** CLI commands, env vars, and local storage paths move to `vibeusage` naming.
- Package publishing updates: primary package becomes `vibeusage` (fallback to `@vibeusage/tracker` if needed), with old packages providing compatibility.
- Docs, copy registry, and SEO assets updated to **VibeUsage**.

## Impact
- Affected specs: `openspec/specs/vibeusage-tracker/spec.md`
- Affected code: CLI (`bin/`, `src/`), Dashboard (`dashboard/`), Edge Functions (`insforge-src/`), tests, docs, copy registry.
- Affected integrations: InsForge Edge Functions, Vercel domains, NPM packages.
