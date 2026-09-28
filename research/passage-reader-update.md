# Passage reader update

28 September 2026 · dataset 2026-09-28.2

## Findings and design

The old Text and Differences tabs contained the same Scripture with different annotations. Text identified other Gospels with colored underlines; Differences highlighted matching and unmatched words for a pair. Read alongside added another edition, an independent choice. Sources and interpretive notes contained separate material.

The reader now has two tabs: **Read** and **Sources & context**. Read groups **Highlight** (Shared wording, Differences, Plain text) and **Second edition** together. Shared wording remains the default. Differences retains pair selection when more than two Gospels are available. The legend stays near the text; layout, normalization, emphasis, explanation, and word counts live in a Reading options disclosure. Existing `tab=differences` and `tab=evidence` links remain usable.

The edition grids share one horizontal scroll container and identical Gospel order. Each secondary edition begins after the complete primary row. Two Gospels remain side by side at narrow widths. Three or four columns have a readable minimum width and scroll within the reader. Landscape reduces spacing and allows four columns where the available width permits. A Single column option supports readers who prefer larger lines. The scrolling area becomes keyboard-focusable and gains an explanatory hint only when its contents overflow.

## Matching change

The previous longest-common-subsequence matcher retained isolated words anywhere in the pair. This produced the reported incidental “and” link between Matthew 19:12 and Mark 10:12.

The matcher now keeps only contiguous runs of at least two words on both sides, including at least one word outside an explicit English/Greek common-connector list. Common words remain when part of a supported phrase. Matching uses source offsets; it does not reconstruct or edit Scripture. Canonical input ordering resolves repeated-word ties consistently when Gospel columns are reversed. Hovering a matching phrase highlights its whole corresponding run.

This is a conservative wording heuristic, not semantic analysis. It deliberately misses some meaningful single-word similarities and cannot guarantee that every repeated phrase expresses the same concept. Unmatched text is not automatically an authorial insertion or deletion. Interpretation and event identity remain in attributed source notes.

The reader, phrase map, and precomputed wording statistics use this rule. Shared-wording underlines additionally require supported phrase segments after verse-boundary splits. A selected comparison highlights only that group's passages; direct chapter reading searches source-attributed mappings and explicitly reviewed related teachings. Statistics identify the method as `phrase-supported-lcs-v1`; files using the previous method are rejected. All three edition files are regenerated, while Analysis continues to show SBLGNT Greek. Passage coverage is unchanged.

## Verification and remaining review

- Regression tests cover the reported Matthew 19:12 / Mark 10:12 link in all three editions, retention of the substantive Matthew 19:9 / Mark 10:11 match, and the unmatched exception clause.
- Tests reject isolated English/Greek connecting words, retain connectors within supported phrases, and preserve matched positions when Gospel order is reversed.
- Server-rendered reader checks compare the displayed Scripture with exact source characters in Shared wording, Differences, and Plain text. They cover three editions, one through four selected Gospels, reverse Gospel order, the feeding, divorce, focused exception-clause, and Lord's Prayer comparisons.
- Existing source/gloss integrity, source offsets, statistics reproduction, timeout, retry, and lock-state checks remain in the suite.
- TypeScript and the production build are release gates. Bible corpora, glosses, source archives, and reference mappings are compared with the repository baseline. Updated machine-readable results are in `release-verification.json`.

**Visual browser review remains outstanding for this revision.** The session's cloud-browser access policy blocked the local preview. Server rendering verifies output text and structure, not CSS geometry, touch gestures, or browser interaction. The earlier Chromium checks in `usability-audit.md` describe older revisions; they do not validate this reader redesign.

Before merging, review: two-Gospel reading at 320/390 px; three/four-column scrolling; 667 × 375 and 844 × 390 landscape; desktop inspector and expanded reading; BSB ↔ Greek second-edition rows; phrase popovers and Greek meanings; keyboard access to horizontal scrolling; Sources & context return; and enlarged text. Physical Safari/iOS, Android, Firefox, and assistive-technology checks remain on the broader roadmap.
