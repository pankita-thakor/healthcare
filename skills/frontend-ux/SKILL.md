# frontend-ux

## Purpose
Ship intentional, accessible, and high-conversion UI for HealthFlow while keeping components modular and maintainable.

## When to use
- New pages/screens
- Dashboard workflows
- Design refactors
- Accessibility and responsive improvements

## Core rules
- Use reusable primitives from `components/ui` before creating new components.
- Keep page files thin; move logic into `hooks/` and `services/`.
- Cover all UX states: loading, empty, success, error.
- Mobile-first responsive behavior required (`sm`, `md`, `lg`, `xl`).
- Use semantic HTML and accessible controls.

## Accessibility checklist
- Inputs have labels and clear error text.
- All interactive elements are keyboard reachable.
- Visible focus states are preserved.
- Color contrast meets WCAG AA.
- Icons-only buttons include `aria-label`.

## UX quality checklist
- Minimize user steps for core actions.
- Keep copy explicit and action-oriented.
- Confirm destructive actions.
- Show progress for async actions.
- Keep role-based navigation clear and predictable.

## Implementation workflow
1. Define user flow + edge states.
2. Build layout with reusable components.
3. Wire form state/validation.
4. Connect service calls and feedback handling.
5. Verify responsive + keyboard + theme behavior.

## Done criteria
- Responsive on mobile/tablet/desktop.
- A11y checks pass.
- UX states implemented.
- No duplicated UI logic.
