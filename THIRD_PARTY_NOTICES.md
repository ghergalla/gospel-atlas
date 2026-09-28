# Third-party sources and notices

These notices apply independently of any license eventually selected for Gospel Atlas's original application code. Retain the source credits and license notices when redistributing their material. No source provider's endorsement is implied.

## Scripture

### Berean Standard Bible (BSB)

The Berean Bible text was dedicated to the public domain. Source: [Berean Bible](https://berean.bible/), [terms](https://berean.bible/terms.htm), publisher downloads at <https://bereanbible.com/>. The Gospel corpus is extracted from publisher TXT and checked against XLSX. Source-format markup is removed and whitespace normalized; source wording is preserved. Archived inputs, retrieval dates, and checksums are in `data/sources/manifest.json`. The BSB USX archive is retained solely to document rejected discrepancies.

### American Standard Version (ASV, 1901)

Public-domain text supplied by [eBible.org](https://ebible.org/asv/). The Gospel corpus is imported from USFX and cross-checked against USFM; supplied footnotes are retained separately. Archived distribution files retain their original notices. Source-format markup is removed and whitespace normalized; source wording is preserved.

### SBL Greek New Testament (SBLGNT)

Edited by Michael W. Holmes. Copyright © 2010 Society of Biblical Literature and Logos Bible Software. Distributed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

Source: [Faithlife/SBLGNT](https://github.com/Faithlife/SBLGNT), commit `c4d241a9c1c479a55b989ba35a4976c1d0b8052c`. Original `About.md`, `README.md`, and `LICENSE` are retained in `data/sources/sblgnt/`. The Gospel text is converted into verse-keyed JSON and checked across text and XML formats. Source wording and source characters are preserved. The full critical apparatus is not presented by the viewer. A copy of the license is in `LICENSES/CC-BY-4.0.txt`.

## Passage relationships and interpretation

### A. T. Robertson, 1922

*A Harmony of the Gospels for Students of the Life of Christ*, by A. T. Robertson, supplies the 184-section baseline and attributed detailed units. Source: [Project Gutenberg ebook 36264](https://www.gutenberg.org/ebooks/36264). The full archived source `data/sources/robertson-1922.html` retains Project Gutenberg's notices and license. The 1922 work is public domain in the United States; the source includes its own distribution guidance.

Gospel Atlas extracts references and labels, records a documented section-boundary decision, adds separately identified editorial units, and paraphrases attributed interpretive notes. It does not present its measured wording scores as Robertson's judgments.

### Augustine

Selected disagreement notes paraphrase attributed passages in Augustine's *Harmony of the Gospels*, with book/chapter links in the viewer. These are interpretive notes, not imported Bible text. No complete modern translation of Augustine is redistributed here. Consult the individual source links and their notices for the translations they host.

## Greek dictionary data

Dictionary fields are credited to [STEP Bible](https://www.STEPBible.org), based on work at Tyndale House, Cambridge. Source: [STEPBible-Data](https://github.com/STEPBible/STEPBible-Data), commit `b99716b0cddb648ddb95cc786a197180f2f97d48`; TAGNT and the associated dictionary fields are distributed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

`data/sources/step/` preserves the downloaded source, its headers, manifest, and README. Gospel Atlas extracts lemma, dictionary gloss, and Strong identifier fields from SBL-labelled rows, and attaches them only to unambiguous verse-local word matches. The exported lookup is a selection and reformatting of those fields. It does not import the extended proper-name descriptions, infer unavailable meanings, or generate phrase translations.

## OpenBible.info cross references

Credit: [OpenBible.info Bible Cross References](https://www.openbible.info/labs/cross-references/), primarily derived from the Treasury of Scripture Knowledge. The source download is labelled CC BY; the site's license link identifies [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The pinned snapshot is dated 2026-09-21 and was retrieved on 2026-09-28. The archive and its checksum are retained in `data/sources/openbible/`. Gospel Atlas filters reference rows to the Gospels, computes coverage and deduplicated pair counts, and provides a separate editorial review. Per-row origins are not supplied by OpenBible, so individual rows are not asserted to be verified transcriptions of TSK. No Scripture quotations from the OpenBible website are imported.

## Interface and dependencies

The used shadcn/ui components are distributed under the MIT License, copyright © 2023 shadcn. See `LICENSES/shadcn-MIT.txt`.

React, Radix UI, Lucide icons, Tailwind CSS, Vite, and their installed dependencies retain their individual licenses. `LICENSES/npm-dependencies.txt` contains notices collected from the exact dependency versions in the release lockfile. Package manifests and upstream projects remain the authorities for their respective terms.

The packaged site also includes a copy of these notices under `docs/THIRD_PARTY_NOTICES.md`, together with license files, so source attribution can accompany a static-site distribution.
