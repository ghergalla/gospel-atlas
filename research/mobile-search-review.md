# Mobile navigation and search review — 5 October 2026

Status: implemented locally for review; not pushed or published.
Base: main at 954825f3d09c55f76707d178ae68fd7ad817da87.

## Changes

- A search icon sits beside Columns and Circle in full-screen exploration.
- Search accepts chapter/verse references, indexed passage titles, related teachings, and words or phrases in the selected edition across all four Gospels. Greek searches tolerate accent differences; displayed Scripture is preserved exactly.
- Selecting a result holds it on the map. Read opens the passage reader. Back or Escape closes search and keeps the current passage/view; opening search focuses its input in the original tap event.
- Search results scroll independently. The full-screen search surface follows the visual viewport when the phone keyboard opens. Loading, no-results, and retry states are explicit.
- The normal mobile view uses an on-demand search input, 36px-high Gospel buttons, a shorter header, and a full-screen action placed before secondary map controls.
- The large overview headline is removed. Scale, focus, and zoom controls are available in Map options on phones. The four detail-level shortcuts remain visible.
- Dataset revision information is available in Sources & method and the footer; opening an older shared link no longer creates a prominent banner.
- Phone landscape safe-area rules are preserved, with compact controls on short landscape screens. Desktop retains its visible search field and full map settings.

## Checks completed

- All 41 automated tests pass, including five search regressions.
- Production build and TypeScript checks pass.
- Search tests cover valid and invalid references, exact chapter boundaries, Lord's Prayer titles and apostrophes, text availability, Greek accent normalization, all-Gospel search, result limits, source-exact rendered snippets, and recovery messaging.
- Source and published data directories are byte-for-byte unchanged from the base. BSB, ASV, SBLGNT, and Greek gloss hashes match the previously approved files.
- A local search sample averaged approximately 11ms per query. This is a development-machine observation, not a phone performance measurement.

## Visual verification limitation

Browser visual and touch verification could not be completed in this environment: local HTTP previews were blocked, and file previews were rejected by the cloud browser's URL policy. No browser/device test is claimed. Responsive rules, state transitions, input focus, and viewport handling were reviewed in code. Real iPhone keyboard behavior and layout still need review before publication.

## Review steps

Open the self-contained review HTML in a browser. With a fresh address, a narrow screen defaults to full-screen exploration, and desktop starts in the regular viewer.

1. Tap search beside Columns/Circle. Enter `Matthew 14`, choose the reference, then tap Read. Confirm Matthew 14 is held and displayed.
2. Repeat in Circle. Search `bread` and `Lord's prayer`; choose a result and check the map and reader.
3. Type a query with no result. Clear it. Back out and reopen search. On a keyboard, use Arrow Down/Up, Enter, and Escape.
4. In Sources & method, confirm the dataset information remains available without a banner obscuring the map.
5. Exit full screen. Check the slimmer Gospel row, search icon, full-screen button, and Map options. Toggle a Gospel, reorder, change edition, and reopen full screen.
6. On an iPhone, check portrait and landscape with the keyboard visible. Results should scroll; input and Back should remain reachable. Select a result, resume scrubbing, then read it.
7. On desktop, check the visible search field, full-screen search, mouse scrubbing, locking/unlocking, and Compare.

The review HTML embeds the existing verified data. It is separate from the live GitHub Pages site. Publishing should follow user review and approval.
