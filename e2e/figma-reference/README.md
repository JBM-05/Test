# Immutable Figma references

These PNGs are checked-in exports from the supplied Figma file and must not be regenerated from
the application:

- `desktop-1440x1077.png` — final desktop page composition (local Figma node `1:27`).
- `mobile-390x1252.png` — final mobile page composition (local Figma node `1:387`).
- `component-overview-1440x1606.png` — alternate component/layout overview (local Figma node
  `1:612`) used to verify card, accordion, review, and guarantee treatments.

The first two are the authoritative page-level pixel gates. The overview deliberately presents a
different 1440px composition, so it is a component reference rather than a second page screenshot
expectation at the same viewport.

Every pixel in both page-level references is compared. The visual gate has no ignored regions.
