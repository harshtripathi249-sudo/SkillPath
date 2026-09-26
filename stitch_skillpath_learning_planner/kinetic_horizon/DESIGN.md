---
name: Kinetic Horizon
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#684000'
  on-tertiary: '#ffffff'
  tertiary-container: '#885500'
  on-tertiary-container: '#ffd4a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a forward-leaning, disciplined optimism tailored for professional learners, career switchers, and certification candidates. The experience balances corporate rigor with modern edtech momentum—making long-term educational objectives feel actionable, structured, and achievable.

The visual direction merges **Modern Technical Clarity** with **Micro-Tactile Progression**. Surfaces are calm, airy, and purposeful, using high-density structured cards, crisp timeline path lines, and deliberate state transitions. Visual excitement is earned rather than ornamental: celebratory feedback is reserved for milestone breakthroughs, credential verification, and verified skill mastery.

The interface evokes focus, momentum, and undeniable credibility, avoiding both juvenile gamification tropes and sterile enterprise training dashboards.

## Colors

The palette establishes an authoritative, high-contrast hierarchy anchored in focused indigo tones, paired with intentional accent semantics:

- **Primary (`#4F46E5` / `#4338CA`)**: Electric indigo to deep violet. Represents the learning trajectory, active paths, navigational anchors, and primary interactive targets.
- **Secondary (`#10B981`)**: Vibrant emerald. Strictly reserved for affirmative milestones, completion rings, step successes, and linear progression indicators.
- **Tertiary (`#F59E0B`)**: Amber gold. Dedicated to industry credentials, accreditation badges, exam readiness states, and verified certification seals.
- **Neutrals (`#0F172A`, `#334155`, `#64748B`, `#F8FAFC`)**: Slate series. Deep slate (`#0F172A`) ensures AAA typographic contrast; cool off-white (`#F8FAFC`) forms the base canvas, while mid-slate shades handle roadmap stems, node borders, and secondary metadata.

Surface nesting uses tonal white cards (`#FFFFFF`) against the `#F8FAFC` background canvas to create distinct content modules without visual clutter.

## Typography

Typographic scale is powered exclusively by Plus Jakarta Sans to maintain geometric crispness, open apertures, and exceptional legibility across dense mobile screens.

- Headlines utilize tight negative tracking (`-0.01em` to `-0.03em`) and heavy weights (`700`–`800`) to communicate authority and goal permanence.
- Body copy uses open line heights (`1.5` to `1.57`) and neutral tracking for sustained reading during exam-prep briefs and module descriptions.
- Pill badges, roadmap statuses, and metadata rely on uppercase or semi-bold labels with expanded letter-spacing (`0.01em` to `0.04em`) to ensure legibility at micro dimensions.

## Layout & Spacing

The layout is built for fluid mobile-first presentation utilizing an 8pt baseline rhythm:

- **Mobile Canvas**: 4-column fluid layout with `1rem` (16px) margins and `1rem` gutters. Vertical stack spacing adheres to strict geometric intervals: `0.5rem` for related grouped items, `1rem` between interconnected track modules, and `1.5rem` to `2rem` between distinct journey chapters.
- **Tablet / Responsive Extensions**: Expands to an 8-column layout with `1.5rem` margins and `1.25rem` gutters, allowing side-by-side arrangement of the curriculum roadmap and verification checklists.
- **Node Spacing**: Learning roadmaps center along an active vertical connector line (`2px` stroke) offset by `1.25rem` from card margins, maintaining constant anchor alignment across scrolling views.

## Elevation & Depth

This design system implements **Tonal Layering with Ambient Ink Diffusion** to support crisp informational hierarchy without muddy drops:

- **Level 0 (Canvas)**: `#F8FAFC` flat surface.
- **Level 1 (Card & Module Resting)**: `#FFFFFF` with a `1px` subtle outline of `rgba(15, 23, 42, 0.06)` paired with a soft ambient shadow: `0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 12px -2px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Active Milestone / Selected Path Node)**: Surface `#FFFFFF` bordered by a `1.5px` primary stroke (`rgba(79, 70, 229, 0.35)`) and an elevated cast: `0 4px 14px -1px rgba(79, 70, 229, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Sticky Action Bars, Milestone Completion Flyouts)**: Elevated floating surfaces anchored by `0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)`.

## Shapes

The geometry uses a balanced **Level 2 (Rounded)** foundation:

- **Cards, Panels, and Pathway Nodes**: `0.5rem` (8px) for internal module elements and `1rem` (16px) for major module containers, presenting a contemporary, tactile silhouette.
- **Status Pills, Tags, and Credential Seals**: Fully rounded pill shapes (`9999px`) provide contrast against structural square-cornered content containers.
- **Interactive Buttons**: `0.75rem` (12px) for structured, confident tapping affordance.

## Components

### Buttons
- **Primary Action**: Solid `#4F46E5` fill with white label (`label-lg`), `0.75rem` border radius, and active states shifting to `#4338CA`. Height: 48px for thumb-zone accessibility.
- **Secondary Action**: White fill with `1px` border in `#E2E8F0`, dark slate text (`#0F172A`).
- **Success/Milestone Action**: Emerald green (`#10B981`) solid fill for immediate milestone completion prompts.

### Chips & Pill Tags
- **Certification Level**: Slate-tinted pill (`rgba(15, 23, 42, 0.06)`) with `#334155` text (`label-sm`).
- **Time/Budget Estimate**: Indigo-tinted background (`#EEF2FF`) with `#4338CA` text.
- **Accredited Badge**: Amber-tinted background (`#FEF3C7`) with `#B45309` text, framed with an optional verified seal icon.

### Roadmap Track Nodes & Connectors
- Continuous `2px` vertical vector running along the left margin.
- **Completed**: `#10B981` line with a solid checkmark node.
- **In-Progress**: `#4F46E5` pulsed border node with dynamic radial progress indicator.
- **Locked/Future**: `#CBD5E1` dashed segment leading to a neutral muted ring.

### Cards
- Curriculum and course modules sit on elevated white surfaces with `1rem` inner padding, containing tag rows at top, clear headline weights, and inline progress bars (`#10B981` progress over `#E2E8F0` track).

### Input Fields & Controls
- Form fields feature an off-white fill (`#FFFFFF`), `1px` crisp border in `#CBD5E1`, and an active focus ring of `3px` in `rgba(79, 70, 229, 0.2)`.
- Checkboxes and radio buttons adopt primary indigo for selection rings and secondary emerald for quiz verification answers.