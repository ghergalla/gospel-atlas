# Gospel cross-reference comparison audit

OpenBible snapshot: **2026-09-21**. Gospel Atlas dataset: **2026-09-28.1**.

The complete mechanical comparison is finished. An editorial sample of 11 links was inspected for usefulness and context; the remaining candidates have not received comprehensive interpretive review.

## Results

| Counting unit | Count |
|---|---:|
| All Bible reference rows in the source | 344,799 |
| Rows whose source and destination are both in the Gospels | 20,193 |
| Within the same Gospel | 8,658 |
| Between different Gospels | 11,535 |
| Cross-Gospel rows entirely within existing source groups | 2,342 |
| Cross-Gospel rows partly within existing source groups | 128 |
| Cross-Gospel rows entirely outside existing source groups | 9,065 |
| Invalid Gospel reference rows quarantined | 0 |

**These are reference rows, not counts of distinct events, teachings, or new parallels.** A row may point to several verses; reciprocal rows also occur.

After expanding target ranges and deduplicating reciprocal and overlapping links, there are **20,569 unique unordered cross-Gospel verse pairs**. Of these, **5,541** share a main Robertson section and **15,028** do not. Of the latter, **45** already belong to an existing supplemental comparison (the anointing study). The remaining **14,983** pairs are absent from every pre-audit group. They are review candidates, not automatically valid parallels.

## By Gospel pair

| Gospels | Within | Partial | Outside | Total directed rows |
|---|---:|---:|---:|---:|
| Matthew / Mark | 817 | 31 | 1,189 | 2,037 |
| Matthew / Luke | 630 | 28 | 2,528 | 3,186 |
| Matthew / John | 111 | 19 | 1,875 | 2,005 |
| Mark / Luke | 564 | 26 | 1,002 | 1,592 |
| Mark / John | 121 | 14 | 865 | 1,000 |
| Luke / John | 99 | 10 | 1,606 | 1,715 |

## Editorial sample and recommendations

This is a deliberately chosen sample of useful teachings, existing links, and thematic links, not a random sample or an estimate of precision.

| Topic and source reference | Disposition | Reason / next step |
|---|---|---|
| The Lord’s Prayer: Matt.6.9 → Luke.11.1-Luke.11.4 | Accept a related-teaching comparison | Use Matthew 6:9–13 and Luke 11:2–4 as editorial reading boundaries, retaining Luke 11:1 as context. Robertson §105 explicitly points back to §54 while presenting a later setting. |
| Marriage and divorce: Matt.19.9 → Mark.10.11-Mark.10.12 | Already represented | Main section 122 and the focused example already connect these references. |
| Teaching about divorce: Matt.19.9 → Luke.16.18 | Candidate for a related-teaching comparison | A closely related saying appears in a separate Robertson section. Review full boundaries, including Matthew 5:31–32, before publication. |
| The mustard seed: Matt.13.31 → Luke.13.18-Luke.13.19 | Candidate for a related-teaching comparison | The parable occurs in separate Robertson sections. Comparing the teaching does not establish one occasion. |
| The leaven: Matt.13.33 → Luke.13.21 | Candidate for a related-teaching comparison | Outside the current shared-section baseline. Consider Luke 13:20 when reviewing context and boundaries. |
| Lament over Jerusalem: Matt.23.37 → Luke.13.34-Luke.13.35 | Candidate needing an attributed setting note | The closely corresponding lament is placed in different Robertson sections. Review interpretations of its setting before publishing a relationship label. |
| Love of God and neighbor: Matt.22.37 → Luke.10.27 | Candidate needing speaker and context notes | Matthew presents Jesus’ answer; Luke presents the lawyer’s answer before the Good Samaritan. Shared wording must not obscure who speaks or merge the settings. |
| Peter’s confessions: Matt.16.16 → John.6.69 | Related testimony; keep out of event-parallel baseline | The confessions occur in separate Robertson sections and differ in wording. A Christological connection does not establish one occasion. |
| God as Father: Matt.6.9 → John.20.17 | Broad thematic link; defer from main map | Father language connects different contexts; this is not another account of the Lord’s Prayer. |
| Anointing accounts: Matt.26.7 → Luke.7.37-Luke.7.38 | Already available as a related-episode comparison | Outside the main baseline but inside the existing editorial anointing study. Preserve its attributed distinction between person and occasion. |
| Beatitudes: Matt.5.3 → Luke.6.20-Luke.6.26 | Already represented; source range is broad | The entire destination range shares §54 and its Beatitudes subsection. This does not make every verse an exact counterpart of Matthew 5:3. |

## Viewer change

The Lord’s Prayer compares **Matthew 6:9–13 with Luke 11:2–4**. Its boundaries are editorial. The source row includes Luke 11:1 as context, and Robertson §105 explicitly refers back to §54. The comparison is accessible from search and from either passage, with context and attribution in the selected reader. Its connector appears only when selected. Existing source-section statistics still use exactly 184 main sections.

Only this accepted comparison enters the viewer. Other sampled recommendations and all unaudited candidates remain outside the interactive relationship dataset.

## Method and limitations

1. Keep all directed source rows with both endpoints in the Gospels, regardless of votes.
2. Validate endpoints against the project verse index; expand target ranges inclusively, including chapter boundaries. Quarantine invalid rows.
3. For each cross-Gospel row, classify all, some, or none of the expanded verse pairs as sharing a main source section.
4. Separately collapse reciprocal and overlapping range rows to unique unordered verse pairs. Same-Gospel rows do not enter these pair totals.
5. Report old editorial examples separately. The new Lord’s Prayer comparison does not enter the pre-audit baseline.
6. Missing a common section is a review candidate, not a newly proven parallel. No automated event, thematic, or confidence classification is assigned.

- OpenBible derives primarily from TSK; this audit does not independently transcribe or certify the complete TSK.
- The export has no per-row source provenance or relationship types. Do not attribute an individual edge to TSK solely from its presence here.
- Votes include seeded site data; they are not confidence, scholarly consensus, or event identity.
- Verse pairs, directed rows, and narrative sections are different counting units.
- No source Bible quotations are imported. Existing BSB, ASV, and SBLGNT corpora remain authoritative.

“Within” is permissive: any two verses in the same main source section count. This audit does not require those individual verses to align lexically. The earlier editorial anointing example is reported separately, and the new prayer comparison is excluded from the pre-audit baseline.

All votes were retained, including 204 cross-Gospel rows with zero or negative votes. No vote threshold or similarity score was used to decide historical identity.

## Sources and reproducibility

- [OpenBible.info source description](https://www.openbible.info/labs/cross-references/)
- [Reference dataset download](https://a.openbible.info/data/cross-references.zip); archived SHA-256: `83e9db0a08054ed99848531512729f0190dbbac85416f408f2362b5dc36d421d`.
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: OpenBible.info. Changes: Gospel filtering, inclusive range expansion, deduplication, and comparison to the existing mapping. No Scripture quotations imported.
- [Robertson, §105](https://www.gutenberg.org/files/36264/36264-h/36264-h.htm#section105), with its reference back to §54.4.
- [Lord’s Prayer reference row](https://www.openbible.info/labs/cross-references/search?q=Matthew+6%3A9).
- Full rows: `public/data/cross-reference-gospel-rows.csv`; machine-readable summary and reviewed sample: `public/data/cross-reference-audit.json`.
- Reproduce offline: `python scripts/audit_cross_references.py`. Acquire the pinned snapshot if missing: append `--acquire`. A source-date or checksum change requires explicit review.
