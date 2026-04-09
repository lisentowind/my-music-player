# Design System Documentation: The High-Fidelity Desktop Experience

## 1. Overview & Creative North Star
This design system is built to transform the act of listening into a gallery-grade experience. Our Creative North Star is **"The Sonic Gallery."** 

We are moving away from the traditional "software utility" look found in many desktop players. Instead, we are treating the UI as an invisible, premium frame for the music. This system breaks the rigid "template" aesthetic through intentional asymmetry, overlapping elements, and high-contrast typography scales. The goal is to create a digital environment that feels as tactile as a vinyl sleeve and as sophisticated as a high-end audio lounge.

## 2. Colors & Tonal Depth
Our palette is rooted in the depth of `background: #0e0e0e`. It is designed to recede, allowing album art and vibrant accents to take center stage.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Traditional lines create a "boxed-in" feel that contradicts the premium, fluid nature of this system. Boundaries must be defined solely through background color shifts (e.g., a `surface-container-low` section sitting on a `surface` background) or subtle tonal transitions.

### Surface Hierarchy & Nesting
Depth is achieved through a physical layering logic. Use the `surface-container` tokens to "stack" the UI:
- **Base Layer:** `surface` (#0e0e0e)
- **Secondary Containers:** `surface-container-low` (#131313) for large sidebar areas.
- **Interactive Elements:** `surface-container-high` (#20201f) or `surface-container-highest` (#262626) for cards and hover states.

### The "Glass & Gradient" Rule
To achieve a "signature" feel, floating elements (like the Now Playing bar or dropdown menus) must utilize Glassmorphism. Use a semi-transparent `surface` color with a `backdrop-blur` (suggested 20px–40px). 
- **Signature Textures:** For primary CTAs, do not use flat colors. Use a linear gradient transitioning from `primary` (#cc97ff) to `primary-dim` (#9c48ea) at a 135-degree angle to provide visual "soul."

## 3. Typography
We utilize a dual-font strategy to balance editorial flair with functional clarity.

- **Display & Headlines:** Use `plusJakartaSans`. This font provides the "Modern Editorial" voice. Use `display-lg` (3.5rem) for artist names and `headline-lg` (2rem) for playlist titles. These should have tight letter-spacing (-0.02em) to feel authoritative.
- **Body & Utility:** Use `inter`. It is the workhorse for tracklists, metadata, and labels. `body-md` (0.875rem) is the standard for track information, ensuring high legibility against dark backgrounds.
- **Hierarchy through Contrast:** Use `on-surface` (#ffffff) for active content and `on-surface-variant` (#adaaaa) for secondary metadata (e.g., play counts or durations).

## 4. Elevation & Depth
In this design system, elevation is a product of light and layering, not structural lines.

- **The Layering Principle:** Place a `surface-container-highest` card on a `surface-container-low` section to create a soft, natural lift.
- **Ambient Shadows:** When an element must "float" (e.g., a context menu), use a shadow with a large blur (30px+) and low opacity (6%). The shadow should be tinted with the `surface-tint` (#cc97ff) at 4% opacity to mimic the way light reflects off high-end hardware.
- **The "Ghost Border" Fallback:** If a container requires definition against a similarly colored background, use a "Ghost Border": the `outline-variant` (#484847) at 15% opacity. Never use 100% opaque borders.
- **Dynamic Glows:** Use the `primary` or `secondary` accent colors to create subtle, blurred background glows (blobs) behind album art to tie the interface to the music’s "mood."

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `DEFAULT` (1rem) roundedness. Use `on-primary-fixed` (#000000) for text.
- **Secondary/Ghost:** No fill. `Ghost Border` (15% opacity `outline-variant`). Text in `on-surface`.
- **States:** On hover, primary buttons should scale to 102% with a subtle `primary_dim` outer glow.

### Chips (Genre/Filter)
- Use `md` (1.5rem) roundedness for a pill shape. 
- Background: `surface-container-highest`.
- Active state: `primary` background with `on-primary` text.

### The Tracklist (Lists)
- **Forbid Dividers:** Do not use lines between tracks. Use `vertical white space` (12px–16px) and a `surface-variant` hover state background with `sm` (0.5rem) rounded corners to indicate selection.
- **Leading Element:** Album art should always have a `sm` (0.5rem) corner radius.

### Input Fields
- Background: `surface-container-lowest` (#000000).
- Border: `none` (use the "Ghost Border" logic for focus states only).
- Typography: `body-md` Inter.

### Featured Artist Card
- Utilize `xl` (3rem) corner radius for large-scale hero cards.
- Apply a subtle `backdrop-filter: blur(10px)` to the bottom text area of the card to ensure legibility over varying artist imagery.

## 6. Do's and Don'ts

### Do:
- **Embrace Negative Space:** Allow at least 32px of padding between major layout sections to let the "Glass" effects breathe.
- **Dynamic Adaptation:** Allow the `primary` token to shift its hue based on the dominant color of the current album art.
- **Micro-interactions:** Use soft eases (cubic-bezier(0.4, 0, 0.2, 1)) for all hover transitions to maintain the "premium" feel.

### Don't:
- **Don't use pure white text for everything:** Reserve `on-surface` (#ffffff) for titles. Use `on-surface-variant` (#adaaaa) for everything else to prevent eye strain.
- **Don't use sharp corners:** Nothing in this system should be less than `sm` (0.5rem) radius. Sharp corners feel "technical" and "cold"; we want "organic" and "luxe."
- **Don't use standard drop shadows:** Avoid the "fuzzy black" shadow. Always tint your shadows or rely on tonal layering first.