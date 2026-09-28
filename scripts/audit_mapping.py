"""Check the outline against Robertson's separately arranged passage register.

This verifies reference transcription, not the event identifications themselves.
The register parser deliberately does not reuse the outline range parser.
"""
from html.parser import HTMLParser
import hashlib
import re


class Tables(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables = []
        self.table = self.row = self.cell = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'table':
            self.table = {'summary': attrs.get('summary'), 'rows': []}
            self.tables.append(self.table)
        elif tag == 'tr' and self.table is not None:
            self.row = []
            self.table['rows'].append(self.row)
        elif tag == 'td' and self.row is not None:
            self.cell = {'text': '', 'href': None}
            self.row.append(self.cell)
        elif tag == 'a' and self.cell is not None:
            self.cell['href'] = attrs.get('href')
        elif tag == 'br' and self.cell is not None:
            self.cell['text'] += ' '

    def handle_data(self, data):
        if self.cell is not None:
            self.cell['text'] += data

    def handle_endtag(self, tag):
        if tag == 'table': self.table = None
        if tag == 'tr': self.row = None
        if tag == 'td': self.cell = None


def audit_mapping(source, groups, books):
    parser = Tables()
    parser.feed(source)
    names = {'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN'}
    register = {}
    for table in parser.tables:
        if table['summary'] not in names:
            continue
        book = names[table['summary']]
        for row in table['rows'][1:]:
            for col in (0, 4):
                if len(row[col:col+3]) < 3:
                    assert all(not c['text'].strip() for c in row[col:]), row
                    continue
                chapter, verse, section = [c['text'].strip() for c in row[col:col+3]]
                if not section:
                    continue
                assert re.fullmatch(r'\d+[ab]?', section), section
                register.setdefault(section, {}).setdefault(book, []).append({
                    'chapter': chapter, 'verse': verse, 'anchor': row[col+2]['href']})

    def expand(book, rows):
        available = next(b['verses'] for b in books if b['id'] == book)
        result = set()
        for row in rows:
            if row['verse'] == '...':
                chapters = set(map(int, row['chapter'].split(',')))
                result.update(v['ref'] for v in available if int(v['ref'].split(':')[0]) in chapters)
                continue
            chapter = int(row['chapter'])
            for part in row['verse'].replace(' ', '').split(','):
                limits = part.split('-')
                start = tuple(map(int, limits[0].split(':'))) if ':' in limits[0] else (chapter, int(limits[0]))
                end = (tuple(map(int, limits[-1].split(':'))) if ':' in limits[-1]
                       else (start[0], int(limits[-1]))) if len(limits) > 1 else start
                chapter = end[0]
                found = [v['ref'] for v in available if start <= tuple(map(int, v['ref'].split(':'))) <= end]
                assert found, row
                result.update(found)
        return result

    assert set(register) == {g['section'] for g in groups}
    checks = []
    for group in groups:
        outline = {p['book']: set(p['refs']) for p in group['passages']}
        listed = {b: expand(b, rows) for b, rows in register[group['section']].items()}
        differences = {}
        for book in outline.keys() | listed.keys():
            a, b = outline.get(book, set()), listed.get(book, set())
            order = lambda r: tuple(map(int, r.split(':')))
            if a != b:
                differences[book] = {'outlineOnly': sorted(a-b, key=order), 'registerOnly': sorted(b-a, key=order)}
        if differences:
            assert group['section'] == '54' and differences == {'MAT': {'outlineOnly': [], 'registerOnly': ['8:1']}}, (group['id'], differences)
        group['referenceAudit'] = 'boundary-variation' if differences else 'agreement'
        group['status'] = 'References checked against the source passage register'
        checks.append({'groupId': group['id'], 'outline': group['sourceRefs'], 'register': register[group['section']],
                       'status': group['referenceAudit'], 'differences': differences})
    return {'sourceSha256': hashlib.sha256(source.encode('latin1')).hexdigest(),
            'method': 'Compare each analytical-outline section with the union of its references in the separately arranged per-Gospel passage register. This is a mechanical source-reference audit, not an independent scholarly endorsement.',
            'checked': len(checks), 'agree': sum(c['status'] == 'agreement' for c in checks),
            'knownBoundaryVariations': 1,
            'resolution': 'Section 54: retain Matthew 5–7 in the book overview. The source register and detailed subsection 548 extend through Matthew 8:1; retain that explicit boundary in the detailed subsection and disclose the difference.',
            'checks': checks}
