# Unified reader and Greek inspection cards

28 September 2026. Based on GitHub main `6a558489500dec2cc202d57779ae844e5ebaaed0`. Publication awaits the owner's review.

## Changes

- One Read surface combines persistent Gospel underlines, transient matching-phrase emphasis, and optional amber unmatched-word emphasis. No separate Shared wording / Differences selector remains. Legacy `tab=differences` URLs still enable unmatched emphasis.
- The selected pair is explicit when unmatched wording is emphasized. All selected Gospel columns remain visible. Matching follows direct source word positions in the same edition, never a global search for the same word or transitive matches through a third Gospel.
- All Greek words have the same inspection structure: exact source word and reference, sourced English meaning, dictionary form, optional dictionary details, then mapped parallels, attribution, and a contextual action. Unknown meanings stay unavailable. Constituent dictionary glosses are never presented as a phrase translation.
- Hover previews wait 250 ms; a short departure grace period lets a pointer enter the card. Click/tap holds a selection. Another deliberate click replaces it. Close, the held pin, or Escape clears it. Keyboard focus previews; arrow keys move within a Gospel; Enter holds the card and focuses its Close control.
- Portrait phones use an expandable bottom panel. Opening it keeps the tapped word above the panel. Short landscape screens use a horizontally anchored, bounded popover. The card body scrolls independently and its close/action controls remain accessible.
- A second edition retains the same Gospel order and horizontal grid. Each edition is aligned independently.

## Source and alignment integrity

No Scripture JSON, Greek gloss source, reference mapping, or exported statistic changed. Scripture is rendered from original source substrings. The phrase matcher remains `phrase-supported-lcs-v1`, including rejection of incidental single words and connector-only runs.

Underlines now retain all positions already accepted by that matcher, including a phrase crossing a verse boundary. Previously a second filter at verse boundaries could label part of a valid match as unmatched. Displayed underline segments may be shorter than the full supporting phrase when verse boundaries or Gospel partners change. A one-word segment's inspection card identifies it as part of a longer supported match.

## Verification

- 36 automated tests pass, including exact rendered Scripture in 63 combinations across all three editions, one through four Gospels, reversed book order, and plain/parallel/unmatched display settings.
- Added regression checks for held selection state, stale hover timers, direct-only highlights, verse-specific mappings, underline/unmatched consistency across verse boundaries, dictionary gloss fidelity, and the unrelated “And” in Mark 10:12.
- TypeScript and the production Vite build pass. Source JSON and the copied `docs/data/` records remain byte-identical to GitHub main.
- Chromium responsive-frame checks: 320 × 568 and 390 × 844 portrait, 844 × 390 landscape, 1180 × 768 laptop, and the full desktop preview. Two phone columns fit without page overflow. Four columns fit at 844 px landscape. Four phone columns scroll within the reading region. Primary and second-edition column positions match exactly.
- Browser interactions checked: matched/unmatched Greek lookup, deliberate held-selection replacement, Close, Escape, arrow-key preview, Enter-to-hold with focus transfer, explicit pair selection, and chapter-to-two-Gospel navigation. The final review copy also loads the packaged app and embedded source data.
- Responsive-frame checks are not physical-device tests. Safari/iOS, Android touch gestures, Firefox, and VoiceOver/NVDA remain manual review items. Pointer hover timing is covered by code/state review; native pointer motion was not automated in this browser tool.

## Review copy

`scripts/build_review.py` packages the production JavaScript, CSS, worker, and byte-identical data as a standalone HTML review copy. It changes neither the source data nor the deployed app. The review copy opens without npm or a local server. Normal production builds continue to load data on demand.

## Integration after approval

The GitHub connection is authenticated as the repository owner and reports push/admin permission. The prepared local branch is `unified-reading-cards`. No remote branch, PR, merge, or publication has been performed for this update.

After review, use the connection to create a review branch from the latest main, upload the changed sources and rebuilt docs, and open a PR. Verify that main has not changed; if it has, reconcile and rerun the relevant gates. Merge only with the owner's approval, then check the Pages deployment. The owner can update the Mac checkout with `git switch main` and `git pull --ff-only origin main`; no patch copying or npm commands are needed.
