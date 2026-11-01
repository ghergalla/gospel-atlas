# Reading and mobile usability audit — 1 November 2026

Scope: mobile portrait and landscape reading, map-to-reader navigation, typography, controls, desktop comparison, and Scripture fidelity. Baseline: `3f1a2267`.

## Findings and implementation

| Finding | Change | Tradeoff |
| --- | --- | --- |
| The four-Gospel desktop reader started Scripture about 800 px below the viewport top. Secondary settings occupied most of the first screen. | Collapse second edition, subsection, layout, normalization and unmatched-word settings into Reading options. Keep Parallel wording and text size visible. Preserve a visible badge and pair label when unmatched emphasis is enabled. | Secondary settings take an extra click. All functionality and explanatory context remain available. |
| Mobile Read returned to the long overview and displayed map-specific locking instructions above the text. | Read opens the focused comparison reader. Back to map returns to the previous visualization and uses full-screen exploration on small screens. Keep Hold/Resume on the map. | A separate reader view is a clearer step in the flow; the desktop map inspector still remains available. |
| Tall controls and repeated captions consumed space. | Compact Gospel chips (32 px), mobile navigation (40 px), reading controls (32–36 px), shorter headers and a smaller full-screen selection footer. Enlarge desktop reorder hit targets to at least 24 px. | Compact controls are smaller than Apple's preferred 44-point targets. They stay above WCAG's 24 CSS-pixel minimum, with spacing, visible focus and explicit labels. This is a deliberate compromise with the request for compact controls, not a blanket accessibility certification. |
| Three/four columns on a portrait phone cannot all be comfortably readable at once. | Default to 16 px English / 16.5 px Greek in narrow multi-column readers, with a 136 px minimum column. Keep two normal-size columns visible on small phones. Show a horizontal-scroll hint and an optional portrait rotation suggestion only when columns overflow. Provide a direct Single column action and a return to comparison. | Four columns use horizontal scrolling in portrait. The app does not force landscape or shrink all four into unreadable slivers. |
| No direct font-size preference. | Add A− / percentage reset / A+ from 85% through 200%, saved per device. Column width grows with text size. Failed/blocked local storage does not prevent reading. | Enlarged multi-column reading may require scrolling. Single-column reading reflows. The preference is intentionally independent of share URLs. |
| Multiple underlines crowded marked phrases. | Reduce underline pitch from 5 to 4 px and thickness from 3 to 2.5 px. Adjust line height while retaining solid, dashed, dot-dash and dotted patterns. | Markings are more delicate; pattern and color still distinguish the Gospels. |
| The mobile word sheet repeated both a held-selection control and a close control. | Keep Close and Expand in the compact sheet header; retain hold controls in the desktop popover. | Tap still holds the selection automatically. No extra pin action is needed in the sheet. |

## Preservation and verification

- `npm run verify`: 43 tests passed, TypeScript and production build passed.
- Reader regression coverage compares rendered Scripture exactly against corpus passages for BSB, ASV and SBLGNT, one through four selected Gospels, reversed Gospel order, plain/shared/unmatched styles, and 85%, 100% and 200% text sizes.
- New preference tests cover bounds, persistence, invalid saved values and unavailable storage.
- No imported text, gloss, mapping or analysis dataset changes.
- Bible and Greek gloss SHA-256 checksums match the baseline:
  - BSB: `c27898352c772bc4df5bd9587e3f1984bad0562f89823f3c1618b5ef9a437212`
  - ASV: `3d95ab15518877b340580797bddd33faf6b114612e280c5c002ff0fbc575fc55`
  - SBLGNT: `88b295adb08774ee6709d9c41d7606cd045b829a603ae4a55925ae7737197615`
  - Greek glosses: `88ee5fb049677c24c46ac18782dd5fbbb8774e61d39834b118c5c676b1a3d4d2`
- An unlinked, noindex developer harness at `qa/reading.html` displays the actual app in resizable same-origin frames. It exercises media queries, orientation, scrolling, navigation and reading controls. It is not device emulation: it cannot establish iOS Safari behavior, physical touch gestures, keyboard intrusion or VoiceOver results.

## Design references

- [WCAG 2.2: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): target size and spacing.
- [WCAG: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): text resizing up to 200% without losing content or controls.
- [WCAG: Orientation](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html): preserve both orientations; rotation is a suggestion, not a requirement.
- [Apple: UI Design Dos and Don'ts](https://developer.apple.com/design/tips/): readable text, alignment, proximity and generous touch targets.

## Remaining device-specific checks

A physical iPhone/iPad Safari pass remains necessary for native virtual-keyboard and safe-area behavior, touch scrubbing, pinch zoom, and VoiceOver. Desktop browser frame checks do not substitute for these. No claim of universal device or WCAG conformance is made.

## Live browser review

The deployed app was exercised in Chrome using the resizable review frames. Widths below refer to the frame dimensions; Chrome's non-overlay scrollbar subtracts 15 px from the content viewport.

- Desktop at 1348 px content width: Scripture began at 505 px, versus approximately 807 px in the baseline screenshot. Four columns fit without page overflow.
- Portrait at 390 × 844: compact controls fit; four columns scroll within the reader while the page stays within its viewport (375 px). The full-screen dialog is correctly positioned at x=0, y=0 with dimensions 390 × 844.
- Landscape at 844 × 390: all four Gospel columns fit in the 797 px reading area with no horizontal scrolling at 100%.
- Tablet at 768 × 1024: all four columns fit in the 721 px reading area with no page overflow.
- Small phone at 320 × 568: 200% text in Single column reflowed into the 273 px reading area without horizontal overflow. Inspection caught an 11 px overflow in the default two-column layout; the final adjustment uses a 128 px minimum for pairs while retaining 136 px for three/four columns.
- Font size 130% survived an actual reload of the enclosing review page and app, then reset to 100% through the percentage button.
- BSB and companion SBLGNT rows had identical Gospel order and column x positions/widths.
- Both matched and unmatched Greek words opened cards with sourced English meanings above parallel-passage information. The compact sheet stayed within the phone viewport, with Close and Expand available.
- Circle → Search → Matthew 14 → Read opened the correct chapter; Back to map returned to Circle in full screen. Overview search for Luke 7 also opened the focused reader. Lock/unlock controls were absent from that reader.
- Mobile Analysis loaded all six pair cards and enabled the Greek CSV export without the previous wording-statistics error.
- Direct chapter/verse readings omit the source-sequence arrows, which would otherwise jump to an unrelated source section. Source-group readers retain previous/next navigation.
- A second audit adjustment removed the obsolete 66 px reader scroll offset that had reserved space for the deleted lock banner. Focused reading now uses an 8 px inset.

These are browser layout and interaction checks, not claims of physical mobile-device testing.

## Follow-up: annotated iPhone spacing feedback

The subsequent screenshot identified excess space between the map and reader, particularly the example links. This update extends the saved text-size steps to 60, 65, 75, 85, 100, 115, 130, 150, 175 and 200 percent.

- Replace the three-row example/section area with a compact navigation row: Examples, Sermon, Parables and Jericho. Keep wrapping available for enlarged interface text. Opening Examples scrolls and focuses its navigation panel.
- Hide the redundant mobile scrubbing-status sentence; the sticky Resume/Hold control remains. Keep chapter-hover feedback. Put the map explanation in Map options on mobile, while retaining the visible line-style key.
- Reduce mobile map and Read actions to 30 px, Gospel chips to 28 px, reader tabs to 30 px, and text-size controls to 28 px including their border. Preserve control labels, focus indicators and the existing default font size.
- Tighten caption, shortcut, heading and hint margins. Before this follow-up, the phone-width map-caption-to-reader distance was 374 px, including a 162 px example-links area (390 px frame, 375 px content viewport).
- The existing 43-test verification now includes the 60% bound, preference persistence at 60%, and exact rendered Scripture at 60%, 100% and 200%. Biblical datasets are unchanged.

These dimensions and the new 60% lower bound supersede the corresponding earlier implementation notes above.
