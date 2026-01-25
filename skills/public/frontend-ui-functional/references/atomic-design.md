# Atomic Design

## Goal
Define UI components in atomic layers to keep structure stable and reusable.

## Rules
- Build from smallest to largest: Atom -> Molecule -> Organism -> Template -> Page.
- Each layer owns structure only; styling comes later.
- Keep props minimal and explicit; avoid leaking child layout details upward.

## Do
- Start with stable primitives (Button, Icon, Input).
- Compose via small, named building blocks.
- Keep data fetching out of atoms/molecules.

## Don't
- Skip layers and create page-specific atoms.
- Encode business logic in atoms.
- Mix layout concerns into basic atoms.

## Minimal Example
- Atom: `Button`
- Molecule: `SearchInput` (Input + Icon + Button)
- Organism: `HeaderSearch`
- Template: `SearchPageLayout`
- Page: `SearchPage`
