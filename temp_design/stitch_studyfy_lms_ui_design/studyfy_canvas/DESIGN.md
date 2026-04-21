# Design System Strategy: The Fluid Academy

## 1. Overview & Creative North Star
This design system moves away from the rigid, "boxed-in" nature of traditional educational software. Our Creative North Star is **"The Fluid Academy."** 

Unlike standard LMS platforms that feel like digital filing cabinets, this system treats the interface as an expansive, breathing workspace. We break the "template" look by utilizing **intentional asymmetry** and **tonal depth**. Large, editorial typography creates a sense of authority, while overlapping surfaces and "floating" elements suggest a workspace that is dynamic and modular. The goal is to make the student feel like they are entering a premium, curated studio rather than a cluttered classroom.

---

## 2. Colors: Tonal Architecture
We define space through light and color, not lines. Our palette utilizes a sophisticated range of lavenders and cool grays to reduce cognitive load.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off the UI. Boundaries must be defined solely through background color shifts. For example, a sidebar should use `surface_container_low` sitting against a `surface` background. 

### Surface Hierarchy & Nesting
Depth is achieved by "stacking" our surface tiers. 
- **Base Layer:** `surface` (#fcf8fe)
- **Secondary Workspace:** `surface_container_low` (#f6f2fa)
- **Primary Content Cards:** `surface_container_lowest` (#ffffff)
- **Interactive Highlighting:** `surface_container_high` (#eae6f1)

### The "Glass & Gradient" Rule
To elevate the UI beyond a standard web app, use **Glassmorphism** for floating elements (like top headers or hover-state modals). Apply `surface_container_lowest` at 70% opacity with a `24px` backdrop-blur. 

### Signature Textures
Main CTAs and progress indicators should not be flat. Use a subtle linear gradient (135°) transitioning from `primary` (#4e4bd5) to `primary_container` (#7472fd). This adds a "lithographic" soul to the interface that feels high-end and custom.

---

## 3. Typography: Editorial Hierarchy
We use a dual-typeface system to balance professional structure with approachability.

- **The Voice (Headlines):** **Plus Jakarta Sans** is our display face. It should be tracked slightly tighter (-2%) in `display-lg` to `headline-sm` sizes to create a modern, editorial impact. Use this for course titles and dashboard welcomes.
- **The Engine (Body):** **Inter** is used for all functional text. It provides exceptional legibility at small sizes (`body-sm` and `label-md`).
- **Visual Weight:** Use `on_surface_variant` (#5f5e68) for secondary metadata to create a natural hierarchy that guides the eye toward the most important information in `on_surface` (#32313b).

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a crutch for poor layout. In this system, we prioritize **Tonal Layering**.

- **The Layering Principle:** Instead of a shadow, place a `surface_container_lowest` card on a `surface_container_low` background. The subtle shift in hex code creates a "soft lift" that feels more integrated into the OS.
- **Ambient Shadows:** When a card must float (e.g., a student's active assignment), use an extra-diffused shadow: `0px 12px 32px rgba(78, 75, 213, 0.06)`. Note the use of a tinted shadow (Primary) rather than gray.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use `outline_variant` (#b3b0bc) at **20% opacity**. Never use 100% opaque borders.
- **Glassmorphism:** Use `surface_container_highest` with a backdrop blur for sidebar navigation to allow the background content to subtly bleed through, softening the edges of the application.

---

## 5. Components

### Buttons
- **Primary:** Gradient (`primary` to `primary_container`), `xl` (1.5rem) corner radius. Use `on_primary` text.
- **Secondary:** `surface_container_high` background with `primary` text. No border.
- **Tertiary:** Ghost style. `on_surface_variant` text, shifting to `surface_container_low` on hover.

### Input Fields
- **Container:** `surface_container_lowest` with a "Ghost Border" (20% `outline_variant`).
- **Focus State:** Border opacity increases to 100% using the `primary` token; add a subtle `primary` outer glow (4px blur).
- **Radius:** Always use `md` (0.75rem).

### Cards & Lists
- **Rule:** Forbid the use of divider lines.
- **Implementation:** Separate course modules using vertical whitespace (`2rem`) or by nesting `surface_container_lowest` cards inside a `surface_container_low` wrapper.
- **Interaction:** On hover, a card should scale by 1.02% and transition its background to `surface_container_lowest` if it isn't already.

### LMS-Specific Components
- **The Progress Orbit:** Instead of a flat bar, use a circular stroke with a `primary` to `tertiary` gradient.
- **The "Study-Mode" Toggle:** A glassmorphic overlay that dims the sidebar and header, leaving only the central content area on a `surface_container_lowest` plane.
- **Course Chips:** Use `secondary_container` with `on_secondary_container` text. Use `full` (9999px) radius for a "pill" aesthetic.

---

## 6. Do's and Don'ts

### Do
- **Do** use whitespace as a structural element. If an element feels cramped, increase the padding rather than adding a line.
- **Do** use `xl` (1.5rem) rounding for large containers and `md` (0.75rem) for smaller interactive elements.
- **Do** ensure all "Student" role views feel warm (`tertiary` accents) and all "Admin" views feel authoritative (`secondary` accents).

### Don't
- **Don't** use pure black (#000000) for text. Always use `on_surface` or `on_surface_variant`.
- **Don't** use 1px dividers to separate list items. Use 8px to 12px of vertical spacing.
- **Don't** use "default" shadows. If it looks like a standard Material Design shadow, it is too heavy. Lighten and tint it.
- **Don't** use sharp corners. Nothing in the "Fluid Academy" should feel dangerous or rigid.