"""Reproducible reference audit; no Scripture text or event identities are inferred.

Run with --acquire once to archive the pinned OpenBible snapshot, then run offline.
The CSV preserves directed source rows. Expanded verse pairs are deduplicated
without direction for the separate pair counts. Votes never filter the audit.
"""
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timezone
import argparse
import csv
import hashlib
import io
import json
import re
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/data'
RAW = ROOT / 'data/sources/openbible'
SNAPSHOT = '2026-09-21'
URL = 'https://a.openbible.info/data/cross-references.zip'
PAGE = 'https://www.openbible.info/labs/cross-references/'
BOOKS = {'Matt': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN'}
NAMES = {'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John'}
ORDER = {b: i for i, b in enumerate(NAMES)}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(acquire=False):
    archive = RAW / f'cross-references-{SNAPSHOT}.zip'
    if not archive.exists():
        if not acquire:
            raise SystemExit('Pinned source missing; run once with --acquire.')
        RAW.mkdir(parents=True, exist_ok=True)
        request = urllib.request.Request(URL, headers={'User-Agent': 'GospelAtlas source audit'})
        with urllib.request.urlopen(request, timeout=45) as response:
            data = response.read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            header = z.read('cross_references.txt').decode('utf-8-sig').splitlines()[0]
        assert header.endswith(SNAPSHOT), ('Unexpected snapshot; review before replacing', header)
        archive.write_bytes(data)
        metadata = {'file': str(archive.relative_to(ROOT / 'data/sources')), 'url': URL,
                    'page': PAGE, 'bytes': len(data), 'sha256': digest(archive),
                    'retrieved': datetime.now(timezone.utc).isoformat(), 'snapshot': SNAPSHOT,
                    'license': 'CC BY (download header); site links to CC BY 4.0',
                    'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/',
                    'attribution': 'OpenBible.info Bible Cross References; primarily derived from Treasury of Scripture Knowledge',
                    'scope': 'Reference identifiers and votes only; no Bible quotations imported.'}
        (RAW / 'manifest.json').write_text(json.dumps([metadata], indent=2) + '\n')
    metadata = json.loads((RAW / 'manifest.json').read_text())[0]
    assert digest(archive) == metadata['sha256'], 'Archived source checksum mismatch'
    manifest_path = ROOT / 'data/sources/manifest.json'
    manifest = json.loads(manifest_path.read_text())
    manifest = [m for m in manifest if not m['file'].startswith('openbible/')]
    manifest.append(metadata)
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    (OUT / 'sources.json').write_text(manifest_path.read_text())

    index = json.loads((OUT / 'index.json').read_text())
    sections = [g for g in index['groups'] if g['kind'] in ('source-group', 'disputed')]
    assert len(sections) == 184
    references = {b['id']: [v['ref'] for v in b['verses']] for b in index['books']}
    membership = defaultdict(set)
    supplemental = defaultdict(set)
    for g in index['groups']:
        target = membership if g in sections else supplemental
        # The audit measures the pre-audit mapping, not the newly accepted prayer.
        if g['kind'] == 'related-teaching':
            continue
        for p in g['passages']:
            for ref in p['refs']:
                target[(p['book'], ref)].add(g['id'])

    def endpoint(value):
        match = re.fullmatch(r'([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)', value)
        if not match:
            raise ValueError('Malformed reference: ' + value)
        book, chapter, verse = match.groups()
        return BOOKS.get(book), f'{int(chapter)}:{int(verse)}'

    def expanded(value):
        parts = value.split('-')
        if len(parts) > 2:
            raise ValueError('Unrecognized range: ' + value)
        book, start = endpoint(parts[0])
        end_book, end = endpoint(parts[-1])
        if book is None or end_book != book:
            raise ValueError('Target crosses books or leaves Gospels: ' + value)
        refs = references[book]
        a, z = refs.index(start), refs.index(end)
        if z < a:
            raise ValueError('Reversed range: ' + value)
        return [(book, ref) for ref in refs[a:z + 1]]

    def pair_key(a, b):
        return tuple(sorted((a, b), key=lambda p: (ORDER[p[0]], *map(int, p[1].split(':')))))

    with zipfile.ZipFile(archive) as z:
        source_text = z.read('cross_references.txt').decode('utf-8-sig')
    source_rows = list(csv.DictReader(io.StringIO(source_text), delimiter='\t'))
    counts = Counter(totalSourceRows=len(source_rows))
    per_pair = defaultdict(Counter)
    unique_pairs = set()
    new_pairs = set()
    in_examples = set()
    valid_rows, invalid_rows = [], []
    for row_number, row in enumerate(source_rows, 2):
        source, target, votes = row['From Verse'], row['To Verse'], int(row['Votes'])
        a_book = source.split('.')[0]
        b_book = target.split('.')[0]
        if a_book not in BOOKS or b_book not in BOOKS:
            continue
        counts['gospelRows'] += 1
        try:
            a = endpoint(source)
            assert a[1] in references[a[0]], 'Unknown source verse'
            targets = expanded(target)
        except (ValueError, AssertionError, KeyError) as error:
            invalid_rows.append({'line': row_number, 'from': source, 'to': target, 'reason': str(error)})
            continue
        same_book = a[0] == targets[0][0]
        counts['sameGospelRows' if same_book else 'crossGospelRows'] += 1
        supported = [bool(membership[a] & membership[b]) for b in targets]
        bucket = 'within' if all(supported) else 'partial' if any(supported) else 'outside'
        pair = '-'.join(sorted({a[0], targets[0][0]}, key=ORDER.get))
        if not same_book:
            counts[bucket + 'Rows'] += 1
            per_pair[pair][bucket] += 1
            counts['crossGospelRowsWithNonpositiveVotes'] += votes <= 0
            for b, covered in zip(targets, supported):
                key = pair_key(a, b)
                unique_pairs.add(key)
                if not covered:
                    new_pairs.add(key)
                    if supplemental[a] & supplemental[b]:
                        in_examples.add(key)
        group_ids = sorted(set().union(*(membership[a] & membership[b] for b in targets)))
        example_ids = sorted(set().union(*(supplemental[a] & supplemental[b] for b in targets)))
        valid_rows.append({'sourceLine': row_number, 'from': source, 'to': target,
                           'votes': votes, 'scope': 'same-gospel' if same_book else 'cross-gospel',
                           'baseline': bucket, 'targetVerseCount': len(targets),
                           'coveredTargetVerses': sum(supported), 'sourceGroups': '|'.join(group_ids),
                           'existingSupplementalGroups': '|'.join(example_ids), 'gospelPair': pair})

    counts['invalidGospelRows'] = len(invalid_rows)
    counts['uniqueCrossGospelVersePairs'] = len(unique_pairs)
    counts['uniqueVersePairsWithinBaseline'] = len(unique_pairs - new_pairs)
    counts['uniqueVersePairsOutsideBaseline'] = len(new_pairs)
    counts['outsidePairsInExistingSupplementalGroups'] = len(in_examples)
    counts['outsidePairsNotInAnyExistingGroup'] = len(new_pairs - in_examples)
    assert counts['gospelRows'] == len(valid_rows) + len(invalid_rows)
    assert counts['crossGospelRows'] == sum(counts[k + 'Rows'] for k in ('within', 'partial', 'outside'))
    assert len(unique_pairs) == len(unique_pairs - new_pairs) + len(new_pairs)
    filename = 'cross-reference-gospel-rows.csv'
    with (OUT / filename).open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(valid_rows[0]))
        writer.writeheader()
        writer.writerows(valid_rows)
    review_path = ROOT / 'data/cross-reference-review.json'
    reviews = json.loads(review_path.read_text()) if review_path.exists() else []
    for review in reviews:
        matches = [r for r in valid_rows if r['from'] == review['from'] and r['to'] == review['to']]
        assert matches, ('Review cites missing source row', review)
        review['sourceRows'] = matches
    audit = {'source': metadata, 'baseline': {'revision': index['revision'], 'sections': 184,
             'sectionReferencesSha256': hashlib.sha256(json.dumps([(g['id'], g['passages']) for g in sections], sort_keys=True).encode()).hexdigest(),
             'definition': 'Shared membership in a main Robertson source section, including disputed groupings. This does not assert that every verse pair is a verbal or event parallel.'},
             'method': ['Keep all directed source rows with both endpoints in the Gospels, regardless of votes.',
                        'Validate endpoints against the project verse index; expand target ranges inclusively, including chapter boundaries. Quarantine invalid rows.',
                        'For each cross-Gospel row, classify all, some, or none of the expanded verse pairs as sharing a main source section.',
                        'Separately collapse reciprocal and overlapping range rows to unique unordered verse pairs. Same-Gospel rows do not enter these pair totals.',
                        'Report old editorial examples separately. The new Lord’s Prayer comparison does not enter the pre-audit baseline.',
                        'Missing a common section is a review candidate, not a newly proven parallel. No automated event, thematic, or confidence classification is assigned.'],
             'counts': dict(counts), 'byGospelPair': dict(per_pair), 'invalidRows': invalid_rows,
             'reviewScope': 'Small editorial sample of the complete mechanical reference audit; not exhaustive scholarly review.',
             'reviewedExamples': reviews, 'rowDownload': filename,
             'limitations': ['OpenBible derives primarily from TSK; this audit does not independently transcribe or certify the complete TSK.',
                            'The export has no per-row source provenance or relationship types. Do not attribute an individual edge to TSK solely from its presence here.',
                            'Votes include seeded site data; they are not confidence, scholarly consensus, or event identity.',
                            'Verse pairs, directed rows, and narrative sections are different counting units.',
                            'No source Bible quotations are imported. Existing BSB, ASV, and SBLGNT corpora remain authoritative.']}
    (OUT / 'cross-reference-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
    report = [
        '# Gospel cross-reference comparison audit', '',
        f'OpenBible snapshot: **{SNAPSHOT}**. Gospel Atlas dataset: **{index["revision"]}**.', '',
        'The complete mechanical comparison is finished. An editorial sample of 11 links was inspected for usefulness and context; the remaining candidates have not received comprehensive interpretive review.', '',
        '## Results', '',
        '| Counting unit | Count |', '|---|---:|',
        f'| All Bible reference rows in the source | {counts["totalSourceRows"]:,} |',
        f'| Rows whose source and destination are both in the Gospels | {counts["gospelRows"]:,} |',
        f'| Within the same Gospel | {counts["sameGospelRows"]:,} |',
        f'| Between different Gospels | {counts["crossGospelRows"]:,} |',
        f'| Cross-Gospel rows entirely within existing source groups | {counts["withinRows"]:,} |',
        f'| Cross-Gospel rows partly within existing source groups | {counts["partialRows"]:,} |',
        f'| Cross-Gospel rows entirely outside existing source groups | {counts["outsideRows"]:,} |',
        f'| Invalid Gospel reference rows quarantined | {counts["invalidGospelRows"]:,} |', '',
        '**These are reference rows, not counts of distinct events, teachings, or new parallels.** A row may point to several verses; reciprocal rows also occur.', '',
        f'After expanding target ranges and deduplicating reciprocal and overlapping links, there are **{len(unique_pairs):,} unique unordered cross-Gospel verse pairs**. Of these, **{len(unique_pairs - new_pairs):,}** share a main Robertson section and **{len(new_pairs):,}** do not. Of the latter, **{len(in_examples):,}** already belong to an existing supplemental comparison (the anointing study). The remaining **{len(new_pairs - in_examples):,}** pairs are absent from every pre-audit group. They are review candidates, not automatically valid parallels.', '',
        '## By Gospel pair', '',
        '| Gospels | Within | Partial | Outside | Total directed rows |', '|---|---:|---:|---:|---:|']
    for pair in sorted(per_pair, key=lambda pair: tuple(ORDER[b] for b in pair.split('-'))):
        c = per_pair[pair]
        report.append('| ' + ' / '.join(NAMES[b] for b in pair.split('-')) + f' | {c["within"]:,} | {c["partial"]:,} | {c["outside"]:,} | {sum(c.values()):,} |')
    report += ['', '## Editorial sample and recommendations', '',
               'This is a deliberately chosen sample of useful teachings, existing links, and thematic links, not a random sample or an estimate of precision.', '',
               '| Topic and source reference | Disposition | Reason / next step |', '|---|---|---|']
    for r in reviews:
        report.append(f'| {r["topic"]}: {r["from"]} → {r["to"]} | {r["disposition"]} | {r["note"]} |')
    report += ['', '## Viewer change', '',
               'The Lord’s Prayer compares **Matthew 6:9–13 with Luke 11:2–4**. Its boundaries are editorial. The source row includes Luke 11:1 as context, and Robertson §105 explicitly refers back to §54. The comparison is accessible from search and from either passage, with context and attribution in the selected reader. Its connector appears only when selected. Existing source-section statistics still use exactly 184 main sections.', '',
               'Only this accepted comparison enters the viewer. Other sampled recommendations and all unaudited candidates remain outside the interactive relationship dataset.', '',
               '## Method and limitations', '']
    report += [f'{i}. {method}' for i, method in enumerate(audit['method'], 1)]
    report += ['', *['- ' + limit for limit in audit['limitations']], '',
               '“Within” is permissive: any two verses in the same main source section count. This audit does not require those individual verses to align lexically. The earlier editorial anointing example is reported separately, and the new prayer comparison is excluded from the pre-audit baseline.', '',
               f'All votes were retained, including {counts["crossGospelRowsWithNonpositiveVotes"]} cross-Gospel rows with zero or negative votes. No vote threshold or similarity score was used to decide historical identity.', '',
               '## Sources and reproducibility', '',
               f'- [OpenBible.info source description]({PAGE})',
               f'- [Reference dataset download]({URL}); archived SHA-256: `{metadata["sha256"]}`.',
               '- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: OpenBible.info. Changes: Gospel filtering, inclusive range expansion, deduplication, and comparison to the existing mapping. No Scripture quotations imported.',
               '- [Robertson, §105](https://www.gutenberg.org/files/36264/36264-h/36264-h.htm#section105), with its reference back to §54.4.',
               '- [Lord’s Prayer reference row](https://www.openbible.info/labs/cross-references/search?q=Matthew+6%3A9).',
               '- Full rows: `public/data/cross-reference-gospel-rows.csv`; machine-readable summary and reviewed sample: `public/data/cross-reference-audit.json`.',
               '- Reproduce offline: `python scripts/audit_cross_references.py`. Acquire the pinned snapshot if missing: append `--acquire`. A source-date or checksum change requires explicit review.', '']
    (ROOT / 'research/cross-reference-audit.md').write_text('\n'.join(report))
    print(json.dumps({'counts': counts, 'byGospelPair': dict(per_pair), 'invalidRows': invalid_rows[:12], 'reviewedExamples': len(reviews)}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--acquire', action='store_true')
    run(parser.parse_args().acquire)
