# Gospel Atlas — implementation and usability audit

27 September 2026 · dataset 2026-09-27.3

This update adds whole-Gospel wording analysis, simultaneous reading in two editions, sourced Greek dictionary lookups, six smaller editorial selections, and responsive usability repairs. The scope below distinguishes verified behavior from checks that still require physical devices or additional browser engines.

## Implemented

- **Analysis:** all three editions, all six Gospel pairs; aligned and unmatched word positions, explicit whole-book denominators, passage sorting/filtering, CSV export, and direct inspection in Differences. Calculations are normally loaded from precomputed files. The 28 September recovery path can calculate them in a background worker if those files are unavailable.
- **Parallel reading:** choose a second edition using “Read alongside.” English and Greek are grouped by Gospel; on a phone each version follows the other. Each edition retains its own exact Scripture text and comparison.
- **Greek help:** hover previews an underlined word; click/tap pins its dictionary gloss, lemma and Strong identifier. Enter, Escape and Close are supported. Source attribution appears in the popup. Dictionary glosses are basic reading aids, not a claim about the complete meaning of a phrase.
- **Smaller units:** three selections in the Jairus/woman account and one each in the feeding, walking on water, and transfiguration. All six are explicitly editorial, remain inside their Robertson source group, and offer the surrounding section for context. The existing 20 transcribed Robertson subdivisions remain distinct.
- **Interpretive notes:** added Augustine’s explanation of the centurion’s approach through messengers (Harmony II.20.48–50). Existing attributed disagreements about the Sermon, Jericho, and anointing accounts remain visible.

## Audit coverage

The live preview was exercised in Chromium at desktop size and inside responsive frames of 320, 390, 768, 1024 and 1440 CSS pixels. Browser scrollbars reduce the document’s content width (for example, a 390-pixel frame had 375 pixels of usable content). These are browser viewport checks, not claims of testing physical iPhones or Android devices.

| Area | Checks performed | Result |
| --- | --- | --- |
| Desktop and tablet | Side-by-side map/reader, Circle, Columns, detailed wording and Analysis; responsive widths through 1440 px | Inspected; usable layouts |
| Phone layout | 320/390 px, four Gospel controls, passage navigation, wording detail, statistics, bilingual reader, Greek popup | Inspected; no document-level horizontal overflow in checked states |
| Enlarged text | Authored test harness doubled computed non-SVG text sizes at 390 and 1024 px | Overflow defects repaired; rechecked with no document-level overflow. This approximates text enlargement, not a full browser-zoom test |
| Gospel selection | One-Gospel empty analysis, two-Gospel analysis, three-Gospel circle, four-Gospel overview, reordered books | Checked; selected books and order retained |
| Reading lock | Keyboard selection of Circle connection, persistent locked reader, changing view, mobile “Read passage” | Checked; mobile jump preserves view state and lock |
| Navigation | Source sections, example study, close-reading level controls, wording arrows, statistics-to-passage link | Checked |
| Greek lookup | Primary/secondary Greek text; click and keyboard Enter; Escape/Close; phone popup boundaries | Checked; sourced popup visible and in bounds |
| Sources dialog | Phone bounds and keyboard dismissal | Checked |
| Text recovery | Temporarily unavailable ASV file; automatic three-attempt error; restore and explicit Retry | Browser recovery verified; ASV returned without substituting another edition |
| Data verification | Existing corpus import checks plus full glossary attachment and statistics reproduction tests | 19 automated tests passed; no unresolved source-format discrepancies |
| Contrast | Revised secondary text and four Gospel label colors against the app background | Calculated ratios 4.76:1–5.67:1 for these checked pairs; not an exhaustive contrast certification |
| Motion | Source review of reduced-motion behavior | Existing reduced-motion styles preserved |
| Loading/performance | Source review and asset sizing; statistics and glosses fetched on demand | No runtime Bible/lexicon API dependency; no numeric Web Vitals or throttled-network score claimed |

## Defects repaired

1. **Mobile reading link replaced the URL’s saved state.** A fragment jump could reset the selected view and release the lock. The jump now scrolls and focuses the reader without replacing the saved-state fragment; choosing it locks the passage.
2. **Enlarged text widened the inspector.** Lock controls and reader tabs now wrap within their pane.
3. **Enlarged phone header and caption overflowed.** Both now wrap instead of forcing horizontal scrolling.
4. **Small phone controls and text.** Main mobile actions now use larger targets; edition/search inputs use 16-pixel text; Scripture uses 20-pixel type; secondary text and Gospel labels have stronger contrast. Dense map marks retain the source-list and reading controls as accessible alternatives.
5. **Word-detail excerpts were cramped on narrow screens.** The two excerpts now stack; word labels remain suppressed where they would crowd the diagram.
6. **Comparison pair could change when books were reordered.** Reader and phrase map now recognize the requested pair in either display order.
7. **Icon-only phone actions lacked a durable visible-text label.** Sources and sharing actions now have explicit accessible names. Passage navigation exposes expanded state and a close control; skip links reach the viewer and text.

## Scripture and lexical integrity

The generated BSB, ASV and SBLGNT Scripture JSON files are byte-for-byte unchanged by this update. The importer again reported zero unresolved cross-format discrepancies across its 12 source checks. This verifies import fidelity; it does not prove that a publisher’s underlying digital transcription is intrinsically error-free.

STEP Bible TAGNT/TBESG dictionary fields are pinned to commit `b99716b0cddb648ddb95cc786a197180f2f97d48`, under CC BY 4.0. Only SBL-labelled rows are considered. Forms are matched within the same verse after documented normalization; all matching rows must agree on lemma, dictionary gloss and Strong identifier. No fuzzy, cross-verse or generated fallback is used. All attached entries were independently checked against the archived source fields in the automated test.

- Greek word positions: **64,686**.
- Positions with attached source glosses: **63,287**.
- Deliberately unavailable positions: **1,399** (including ambiguous or unmatched forms).

Unmatched wording is a property of a particular alignment. It does not automatically mean a narrative detail was added or deleted, or establish event identity. Whole-book totals deduplicate word positions. Per-section CSV rows must not be summed to reproduce those union totals. All current section comparisons were computed within the alignment limit.

## Remaining platform validation

The following were not available in this audit and should be completed before describing the app as fully cross-browser/accessibility certified:

- Real iPhone/iPad Safari and Android Chrome, including touch gestures, orientation changes, browser chrome and on-screen keyboard behavior.
- Firefox and desktop Safari; native downloads and clipboard permission behavior in each browser.
- VoiceOver and NVDA screen-reader sessions, including Greek pronunciation and navigation through many word buttons.
- Real 200%/400% browser zoom, forced-colors/high-contrast settings, and a comprehensive automated/manual WCAG review.
- Throttled mobile performance, Core Web Vitals, and long-session memory profiling.

The app is ready for the next review of its private preview. Remaining product work includes further attributed interpretive review, sourced phrase-level meanings, KJV, and GitHub release/license preparation.


## Follow-up interaction audit · 28 September 2026

This pass addresses a hard-to-find unlock action, touch scrolling over the map, single-passage wording exploration, and failed Analysis loading.

| Area | Verified behavior |
| --- | --- |
| Desktop lock | Resume scrubbing beside the map releases the lock. Keyboard Enter locks a connection; Escape restores previewing. |
| Immersive map | Accessible dialog fills the viewport. Pointer capture and `touch-action: none` are confined to the immersive SVG; the normal page keeps scrolling. Dragging previews, release holds, and Read closes the dialog and focuses the reader. |
| Columns gesture | Drag tested at desktop and 390-pixel phone-frame width. The selected source section changed and became held; the underlying page's scroll position stayed at 230 pixels throughout the phone-frame drag. |
| Circle gesture | Drag tested in a landscape phone frame; a new passage was held. Circle/Columns switches and chapter controls remain available. |
| Responsive geometry | 320 × 680 and 390 × 844 portrait, and 844 × 390 landscape frames. Full-screen dialogs fit without horizontal overflow. Landscape gives the passage a side panel to preserve map height. |
| Enlarged text | Computed non-SVG text doubled at 320 pixels. Full-screen controls wrap, Exit and Read remain reachable, and the surface no longer overflows horizontally. The map necessarily has less available space. This is not a physical-device/browser-zoom certification. |
| Phrase navigation | Matthew 19:9 opens Matthew/Mark; Matthew 19:14 opens Matthew/Mark/Luke; a Matthew 14:19 phrase opens all four Gospels. Deselecting a Gospel in the popup changes the offered reader count. |
| Wording interpretation | Matthew 19:9's exception clause is uncolored while aligned surrounding wording links to Mark. Highlights retain the exact source characters. Related-occasion anointing examples are excluded from the coloring baseline. |
| Greek support | SBLGNT wording colors and phrase popup inspected. The popup retains STEP Bible dictionary meanings for the constituent words, clearly distinguished from a phrase translation. |
| Analysis fallback | Simulated HTTP 503 responses for statistics files. BSB statistics recovered in the background from loaded text; the Matthew/Mark card reproduced 6,478 / 6,476 aligned words and the normal denominators. |
| Explicit Retry | Simulated both download and calculation failure for ASV, observed the error, restored availability and clicked Retry. ASV statistics loaded successfully with 6,715 / 6,715 aligned words. |
| Automated checks | All 25 tests passed: source integrity, glossary attachment, statistics reproduction, lock state, phrase source offsets/partners/scope, revision validation, timeout and retry recovery. TypeScript and production build are checked in the publishing workflow. |

The original production failure did not reproduce in a fresh session, and production Worker logs contained no matching server error. The old implementation used unversioned statistics requests and repeated the same request after failure. This update repairs those recovery weaknesses; it does not claim a proven diagnosis of the user's original cache or connection state.

No Scripture JSON, Greek gloss source, mapping reference, or precomputed statistics file was edited. The feature wraps existing source substrings; matching metadata is separate. This pass uses Chromium pointer drags and responsive frames, not native touch emulation or physical iOS/Android hardware. Safari, Firefox, VoiceOver/NVDA, native touch behavior, and throttled-device performance remain on the validation roadmap above.


## Companion editions and underline clarity · 28 September 2026

- Read alongside now explains its second-edition role. Primary and companion texts have separate labeled sections with identical Gospel grids. Single edition removes the companion section and extra headings.
- Chromium at 1,363 pixels: two-, three-, and four-Gospel comparisons begin each edition on a shared vertical position. Checked BSB → SBLGNT and SBLGNT → BSB with the feeding of the five thousand, whose Gospel texts have unequal lengths. ASV selection and Single edition were checked too.
- Portrait frames at 390 and 320 pixels, and a landscape frame at 844 × 390: the reader has no horizontal document overflow. Portrait passages stack within each labeled edition; landscape wraps the four Gospels into matching two-column grids.
- Matthew uses solid blue, Mark dashed rust, Luke double purple, and John dotted green. Patterns appear in the legend, exact-source phrase spans, and popup partner labels. Additional line spacing accommodates up to three partner marks. Natural phrase wrapping remains intact.
- Keyboard Enter still opens a Greek phrase popup at narrow phone width, including the verified constituent dictionary meanings. The Text and Differences tabs retain both editions, independently compared within each edition.
- TypeScript passed. Scripture corpora, mapping references, glossary data, and precomputed statistics remain unchanged. These are Chromium responsive-frame checks; physical-device and other-browser checks remain on the roadmap.


## Production full-screen positioning and Luke pattern · 28 September 2026

The reported off-corner explorer was reproduced with the published build's stylesheet. The ordinary dialog inherited `translate-x-[-50%]` and `translate-y-[-50%]`. Although the source CSS reset `translate: none !important`, production optimization folded that declaration into `transform: none !important`; this did not cancel the independent translation utilities. At 1,363 × 894, the modal began at (−681.5, −447), placing half of it offscreen on both axes. Previous development-style checks missed this distinction.

The explorer now replaces the centered-dialog utilities with explicit zero top, left, x-translation, and y-translation classes at its call site. No shared dialog primitive was changed. With the newly built stylesheet and the development stylesheet removed, the explorer bounds were (0, 0, 1363, 894), (0, 0, 390, 844), (0, 0, 320, 680), and (0, 0, 844, 390). Exit and Read stayed inside each viewport. Circle switching, a portrait column drag that held a new passage, Read returning to that selection, and reopening were checked.

Luke now uses one purple dot-dash stroke, with the same pattern in phrase underlines, legend, and partner labels. The purple color is unchanged. Each other Gospel still contributes one underline row. TypeScript and the production build passed. Scripture, mapping, and glossary data were unchanged. Tests here use Chromium and responsive frames; physical iOS/Android and other-browser verification remain outstanding.


## Mobile entry, compact controls, and search · 28 September 2026

- Parallel wording defaults on; comparison links without a wording parameter showed the enabled switch. An explicit `wording=0` link retained the disabled switch.
- A fresh 390 × 844 phone frame opened the full-screen explorer. A landscape 844 × 390 map link without an explicit explorer preference did too. Desktop startup stayed in the ordinary map view, and comparison links bypassed the explorer. Explorer state is now included in saved-view URLs so Exit/Read can be retained across reloads.
- All four Gospel controls occupied one row at 390 and 320 pixels. At 320, each chip measured 64.5 pixels wide and their shared row had no horizontal overflow. The Order popover moved Luke ahead of Mark and reflected the same order in the top row. Desktop ordering controls are preserved.
- The previous compact navigation panel was fixed over the search input when focus opened it. The replacement results panel participates in layout below the toolbar. At 390 pixels, the input ended at y=291 and results began at y=305. Focus stayed in the input while entering Matthew 14. Enter closed results and focused the reader headed Matthew 14, with wording marks visible.
- TypeScript and the production build are release checks. Scripture, glosses, reference mappings, and statistics data are unchanged. Browser checks use Chromium responsive frames and keyboard events; physical phone keyboards and Safari/Android hardware are not certified by this pass.

## Lord’s Prayer and related teachings (28 September 2026)

- Added the prayer under Related teachings, separate from source sections and example studies. Straight/curly apostrophes and “Our Father” are searchable. Selecting it opens both participating Gospels, including a currently hidden partner.
- Chapter reading and source context offer a single comparison link. The selected reader supplies attribution and context links; no permanent overview connector is added.
- Selected related-teaching highlights are restricted to the displayed comparison, preventing unrelated matches elsewhere in Luke from appearing as prayer matches. Full-chapter reading can still discover all reviewed comparisons.
- Browser checks: desktop Text/Differences/Evidence; Luke context and return; phone search plus Enter at 390px and layout at 320px. No horizontal overflow at either tested phone width. Existing source-section statistics and all three Scripture files are unchanged except for the statistics’ dataset revision. Physical phone keyboard and assistive-technology testing remain on the roadmap.
