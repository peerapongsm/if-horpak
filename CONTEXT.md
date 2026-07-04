# CONTEXT — «if — ถ้า» (นิยายเลือกทางเดิน / CYOA anthology)

Glossary for the interactive-fiction collection served at `if.peerapongsm.dev/<slug>`.
Ubiquitous language only — no implementation details.

## Core terms

- **Collection** — the whole anthology «if — ถ้า». One app, one domain, many Stories.
- **Story** — one self-contained branching narrative, addressed by its **slug** (`horpak`, `bus`, `faen-plom`, `borisat`). Has its own genre, meter, endings, and save.
- **Slug** — a Story's stable ascii-kebab id. Doubles as its route (`/faen-plom`) and its localStorage namespace. Never changes once shipped.
- **Genre** — a Story's category tag shown on its card (สยองขวัญ / โรแมนซ์ / เสียดสี / …). Presentational + future grouping; does not affect mechanics.
- **Node** — one screen of narrative text plus the Choices offered from it. A **terminal node** is an Ending.
- **Choice** — a labelled branch from a Node. May require Flags, set Flags, and/or change the Meter.
- **Flag** — a named boolean fact about the run (e.g. "opened up", "sided with him"). Set by Choices, read by later Choices' requirements. **Flags select which Ending you reach.**
- **Meter** — a single named gauge tracking run tension (สติ / ความสนิท / แบตใจ). Has a **start**, a **max**, and a **floor**. **The Meter does not select good Endings — it only fails the run at the floor.**
- **Floor node** — the Ending you are forced into the moment the Meter reaches its floor (a failure/loss Ending). One per Story.
- **Ending** — a terminal outcome. Each Story has a fixed set; a **secret Ending** hides its title as "???" on the collection screen until the player has reached it once.
- **Chapter** — a Story's progress marker: a display label plus index/total, rendered as a progress bar. Meaning is per-genre (romance = day 3/7; office = scene beat, label shows the clock).

## Meter visualisation

- **Meter viz** — how a Story draws its Meter: `candles` (สติ, horpak/bus), `hearts` (ความสนิท, romance), `battery` (แบตใจ, office). Chosen per Story.

## Deliberately NOT in the model (v1)

- Meter thresholds do not gate Endings (Flags do). "Reach the good ending only if intimacy ≥ 4" is **not** expressible in v1 — it is a documented future extension, not current language.
- Multiple Meters per Story — future extension.
