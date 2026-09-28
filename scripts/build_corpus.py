"""Import only downloaded source text; fail on cross-format discrepancies."""
from pathlib import Path
import re,json,zipfile,xml.etree.ElementTree as ET,hashlib,html,itertools
from audit_mapping import audit_mapping

ROOT=Path(__file__).resolve().parents[1]; RAW=ROOT/'data/sources'; OUT=ROOT/'public/data'; OUT.mkdir(parents=True,exist_ok=True)
BOOKS={'MAT':'Matthew','MRK':'Mark','LUK':'Luke','JHN':'John'}
SHORT={'Matt':'MAT','Mark':'MRK','Luke':'LUK','John':'JHN'}
norm=lambda s:' '.join(s.split())
texts={ed:{b:{} for b in BOOKS} for ed in ['BSB','ASV','SBLGNT']}
notes={ed:{b:{} for b in BOOKS} for ed in texts}
checks=[]
def xml_text(root,book,edition,usx=False):
    result={}; ns={}; chapter=0; current=None
    def add(s):
        if current and s:result[current]+=s
    def walk(e):
        nonlocal chapter,current
        tag=e.tag; style=e.get('style','')
        if tag in ['chapter','c']:
            chapter=int(e.get('number') or e.get('id')); current=None;return
        if tag in ['verse','v']:
            n=e.get('number') or e.get('id')
            if n:current=f'{chapter}:{n}';result[current]=''
            elif e.get('eid'):current=None
            return
        if tag=='ve':current=None;return
        if tag in ['note','f','x']:
            if current:ns.setdefault(current,[]).append(norm(''.join(e.itertext())))
            return
        if tag in ['id','h','toc','title'] or (tag in ['p','para'] and (style.startswith(('mt','toc','s','r','h')))):return
        add(e.text)
        for child in e:
            walk(child);add(child.tail)
        if tag in ['p','q','para']:add(' ')
    walk(root)
    return {k:norm(v) for k,v in result.items()},ns

for line in (RAW/'bsb.txt').read_text(encoding='utf-8-sig').splitlines():
    m=re.match(r'^(Matthew|Mark|Luke|John) (\d+:\d+)\t(.*)$',line)
    if m:
        b=next(k for k,v in BOOKS.items() if v==m[1]);assert m[2] not in texts['BSB'][b];texts['BSB'][b][m[2]]=m[3]
z=zipfile.ZipFile(RAW/'bsb_usx.zip')
differences=[]; rejected_usx=[]
for b in BOOKS:
    other,ns=xml_text(ET.fromstring(z.read('bsb_usx/'+b+'.usx')),b,'BSB',True);notes['BSB'][b]=ns
    for ref in set(other)|set(texts['BSB'][b]):
        if norm(other.get(ref,''))!=norm(texts['BSB'][b].get(ref,'')):rejected_usx.append({'edition':'BSB','book':b,'ref':ref,'txt':texts['BSB'][b].get(ref),'xml':other.get(ref)})
    # This export has an extraneous 'vvv' at Luke 9:33 and formatting
    # differences. Do not use its text or notes in the application.
    notes['BSB'][b]={}

# Validate BSB against the publisher's independent spreadsheet export.
z=zipfile.ZipFile(RAW/'bsb.xlsx');ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ss=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
sheet={b:{} for b in BOOKS}
for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//x:row',ns):
    cells={c.get('r')[0]:ss[int(c.find('x:v',ns).text)] for c in row if c.get('t')=='s' and c.find('x:v',ns) is not None}
    m=re.match(r'^(Matthew|Mark|Luke|John) (\d+:\d+)$',cells.get('B',''))
    if m:sheet[next(b for b,n in BOOKS.items() if n==m[1])][m[2]]=cells.get('C','')
for b in BOOKS:
    for ref in set(sheet[b])|set(texts['BSB'][b]):
        if sheet[b].get(ref)!=texts['BSB'][b].get(ref):differences.append({'edition':'BSB','book':b,'ref':ref,'txt':texts['BSB'][b].get(ref),'xlsx':sheet[b].get(ref)})
    checks.append({'edition':'BSB','book':b,'check':'Official TXT versus XLSX (exact verse strings)','verses':len(sheet[b])})

z=zipfile.ZipFile(RAW/'asv_usfx.zip');root=ET.fromstring(z.read('eng-asv_usfx.xml'))
for book in root.findall('book'):
    b=book.get('id')
    if b in BOOKS:texts['ASV'][b],notes['ASV'][b]=xml_text(book,b,'ASV')
z=zipfile.ZipFile(RAW/'asv_usfm.zip')
for b in BOOKS:
    source=z.read(next(n for n in z.namelist() if b in n and n.endswith('.usfm'))).decode('utf-8-sig')
    other={}
    for ch,body in re.findall(r'\\c (\d+)\s+(.*?)(?=\\c |\Z)',source,re.S):
        for verse,body in re.findall(r'\\v (\d+)\s+(.*?)(?=\\v |\Z)',body,re.S):
            body=re.sub(r'\\f .*?\\f\*','',body,flags=re.S)
            body=re.sub(r'\\w ([^|]*?)\|[^\\]*\\w\*',r'\1',body)
            body=re.sub(r'\\[a-z]+\d*\*','',body)
            body=re.sub(r'\\[a-z]+\d*[ \t]?','',body)
            other[f'{ch}:{verse}']=norm(body)
    for ref in set(other)|set(texts['ASV'][b]):
        if other.get(ref)!=texts['ASV'][b].get(ref):differences.append({'edition':'ASV','book':b,'ref':ref,'usfm':other.get(ref),'usfx':texts['ASV'][b].get(ref)})
    checks.append({'edition':'ASV','book':b,'check':'eBible USFM versus USFX (whitespace normalized)','verses':len(other)})

for short,b in SHORT.items():
    for line in (RAW/f'sblgnt/data/sblgnt/text/{short}.txt').read_text(encoding='utf-8-sig').splitlines():
        m=re.match(r'^\w+ (\d+:\d+)\t(.*)$',line)
        if m:texts['SBLGNT'][b][m[1]]=m[2].rstrip()
    root=ET.parse(RAW/f'sblgnt/data/sblgnt/xml/{short}.xml').getroot();words={};current=None
    for e in root.iter():
        if e.tag=='verse-number':current=e.get('id').split(' ')[1];words[current]=[]
        if e.tag=='w' and current:words[current].append(e.text or '')
    # Exact lexical sequence, ignoring apparatus/punctuation only for this check.
    tokenize=lambda s:re.findall(r"[^\W\d_]+(?:[’ʼ'][^\W\d_]+)*[’ʼ']?",s,re.UNICODE)
    for ref in set(words)|set(texts['SBLGNT'][b]):
        a=tokenize(texts['SBLGNT'][b].get(ref,''));bb=[t for w in words.get(ref,[]) for t in tokenize(w)]
        if a!=bb:differences.append({'edition':'SBLGNT','book':b,'ref':ref,'txt_words':a,'xml_words':bb})
    checks.append({'edition':'SBLGNT','book':b,'check':'Official TXT lexical sequence versus XML word nodes','verses':len(words)})

rejected_usx.sort(key=lambda d:(list(BOOKS).index(d['book']),tuple(map(int,d['ref'].split(':')))))
report={'checks':checks,'discrepancies':differences,'rejectedBsbUsx':{'reason':'Source export differs from official plain text, including extraneous vvv at Luke 9:33. Not used for displayed text or notes.','differences':rejected_usx},'counts':{ed:{b:len(v) for b,v in data.items()} for ed,data in texts.items()}}
(ROOT/'data/import-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'counts':report['counts'],'discrepancies':len(differences),'first':differences[:3]},ensure_ascii=False,indent=2))
if differences:raise SystemExit('Resolve source-format discrepancies before building the corpus.')

for ed in texts:
    payload={'edition':ed,'books':texts[ed],'notes':notes[ed]}
    (OUT/f'{ed}.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n')

book_index=[]
for b,name in BOOKS.items():
    refs=sorted(set().union(*(texts[ed][b] for ed in texts)),key=lambda r:tuple(map(int,r.split(':'))))
    offset=0;verses=[]
    for ref in refs:
        n=len(re.findall(r'[^\W\d_]+',texts['SBLGNT'][b].get(ref,''),re.UNICODE));verses.append({'ref':ref,'offset':offset,'words':n});offset+=n
    book_index.append({'id':b,'name':name,'chapters':max(int(r.split(':')[0]) for r in refs),'words':offset,'verses':verses})

# Transcribe only reference rows from Robertson's analytical outline. The
# displayed titles below are editorial labels; original headings remain in data.
source=(RAW/'robertson-1922.html').read_text(encoding='latin1')
block=source.split('<a name="outline"></a>')[1].split('</table>')[0]
rows=re.findall(r'<tr>(.*?)</tr>',block,re.S)
clean=lambda s:norm(html.unescape(re.sub('<[^>]+>',' ',s)))
groups=[]; skipped=[]
def ranges(raw):
    found={}; book=None;chapter=None
    for piece in raw.rstrip('.').split(';'):
        piece=piece.strip()
        m=re.match(r'(Matt\.|Mark|Luke|John)\s+(.*)',piece)
        if m:book={'Matt.':'MAT','Mark':'MRK','Luke':'LUK','John':'JHN'}[m[1]];piece=m[2];chapter=None
        elif re.match(r'[A-Za-z]|\d+\s+[A-Za-z]',piece):book=None;continue
        if book is None:continue
        chapter_mode=':' not in piece
        for spec in piece.split(','):
            spec=spec.strip().rstrip('.')
            if not spec:continue
            halves=spec.split('-');start=halves[0]
            if chapter_mode:chapter=int(start);a=(chapter,1)
            elif ':' in start:chapter,verse=map(int,start.split(':'));a=(chapter,verse)
            else:assert chapter is not None,(raw,spec);a=(chapter,int(start))
            if len(halves)==2:
                end=halves[1]
                if chapter_mode:z=(int(end),999)
                elif ':' in end:ec,ev=map(int,end.split(':'));z=(ec,ev)
                else:z=(chapter,int(end))
            else:z=(a[0],999) if chapter_mode else a
            chapter=z[0]
            rr=[v['ref'] for v in next(x for x in book_index if x['id']==book)['verses'] if a<=tuple(map(int,v['ref'].split(':')))<=z]
            assert rr,(raw,spec)
            found.setdefault(book,[]).extend(rr)
    return [{'book':b,'refs':sorted(set(rs),key=lambda r:tuple(map(int,r.split(':'))))} for b,rs in found.items()]

assert ranges('John 15, 16')[0]['refs'][-1]=='16:33'
assert ranges('Matt. 24, 25')[0]['refs'][-1]=='25:46'
assert ranges('John 11:55-12:1, 9-11')[0]['refs']==['11:55','11:56','11:57','12:1','12:9','12:10','12:11']

for i,row in enumerate(rows):
    m=re.search(r'href="#section(\d+[ab]?)"',row)
    if not m or not 1<=int(re.match(r'\d+',m[1])[0])<=184:continue
    section=m[1]
    # Only main section labels, not secondary cross-references inside a title.
    if not re.search(r'^\s*<td[^>]*>\s*<a href="#section'+re.escape(section)+'"',row):continue
    refline=clean(rows[i+1]);passages=ranges(refline)
    if not passages:skipped.append({'section':section,'reference':refline});continue
    title=clean(row).split(':',1)[-1].strip()
    display_title=title.capitalize()
    for proper in ['Jesus','Christ','God','Holy Spirit','Logos','Matthew','Mark','Luke','John','Peter','Simon','Mary','Martha','Zacharias','Elizabeth','Joseph','Jerusalem','Jericho','Galilee','Judaea','Judea','Bethany','Capernaum','Pharisees','Pharisee','Sadducees','Sabbath','Baptist','Nazareth','Paul','Thomas','Pilate','Herod','Caiaphas','Annas','Judas','Gethsemane','Israel','Abraham','Isaac','Jacob','Moses','Elijah','Samaritan','Samaritans','Sanhedrin','Passover','Emmaus','Bethsaida','Decapolis','Tyre','Sidon','Magnificat','Messiah','Lord','Simeon','Anna','Magi','Jews','Egypt','Bethlehem','Nicodemus','Samaria','Sychar','Cana','Nain','Beelzebub','Gerasene','Antipas','Tiberias','Machærus','Gennesaret','Galilean','Syro-Phoenician','Phoenicia','Hermon','Magadan','Dalmanutha','Julias','Philip','Jordan','Perea','Lazarus','James','Zacchæus','Greeks','Herodians','Cæsar','David','Jewish','Roman','Golgotha','Magdalene']:
        display_title=re.sub(r'\b'+re.escape(proper)+r'\b',proper,display_title,flags=re.I)
    g={'id':'r'+section,'section':section,'title':display_title,'sourceTitle':title,'sourceRefs':refline,'passages':passages,'kind':'source-group','status':'Source-transcribed','sourceUrl':'https://www.gutenberg.org/files/36264/36264-h/36264-h.htm#section'+section,'notes':[]}
    groups.append(g)

titles={'24':'The baptism of Jesus','25':'The temptation of Jesus','43':"Peter’s mother-in-law",'45':'A man with leprosy','46':'The paralytic lowered through the roof','47':'The calling of Matthew','48':'A question about fasting','50':'Grainfields on the Sabbath','51':'The man with a withered hand','54':'The Sermon on the Mount / Plain','55':"The centurion’s servant",'59':'Anointing in the house of Simon the Pharisee','63':"Jesus’ mother and brothers",'65':'Jesus calms the storm','67':"Jairus’ daughter and the woman healed",'72':'The feeding of the five thousand','74':'Jesus walks on the water','82':"Peter’s confession",'85':'The transfiguration','122':'Teaching about marriage and divorce','123':'Jesus welcomes the children','126':'The blind men at Jericho','128b':'The entry into Jerusalem','141':'The anointing at Bethany','148':'The Lord’s Supper','153':'The arrest of Jesus','164':'Jesus on the cross','165':'The death of Jesus','167':'The burial of Jesus','171':'The empty tomb','176':'The road to Emmaus','179':'Jesus appears to Thomas','180':'Jesus by the Sea of Galilee'}
for g in groups:
    if g['section'] in titles:g['title']=titles[g['section']]
    if g['section']=='54':
        g['kind']='disputed';g['notes']=[{'label':'One discourse or similar discourses','text':'Robertson treats Matthew 5–7 and Luke 6:17–49 as one discourse. Augustine considers both two similar discourses and one discourse delivered on a level place on the mountain. Shared teaching can be compared without making the event identification automatic.','source':'Augustine, Harmony II.19.44–47; compare Robertson §54 and Note 9','url':'https://www.newadvent.org/fathers/1602219.htm'},{'label':'A boundary difference within the source','text':'Robertson’s main outline ends this Matthew passage at chapter 7. His passage register and final detailed subsection include Matthew 8:1. The book overview follows the main outline; the conclusion subsection retains its explicit Matthew 8:1 boundary.','source':'Robertson analytical outline, passage register, and §54.8','url':'https://www.gutenberg.org/files/36264/36264-h/36264-h.htm#section548'}]
    if g['section']=='126':
        g['kind']='disputed';g['notes']=[{'label':'Event identification differs','text':'Robertson groups Matthew, Mark, and Luke in §126. Augustine treats Matthew and Mark as the same healing, but Luke as a similar healing of another blind man on approaching Jericho. These connections express a comparison, not a settled event identification.','source':'Augustine, Harmony of the Gospels II.65.125–126','url':'https://www.newadvent.org/fathers/1602265.htm'}]
    if g['section'] in ['59','141']:
        g['notes']=[{'label':'Person and occasion are separate questions','text':'Robertson treats Luke 7 and the Bethany anointing as distinct occasions and rejects identifying Luke’s woman with Mary of Bethany. Augustine also distinguishes the occasions, but identifies the woman as the same Mary. The texts and these attributed interpretations are kept separate.','source':'Robertson §59 note; Augustine, Harmony II.79.154–155','url':'https://www.newadvent.org/fathers/1602279.htm'}]

source_count=len(groups)
audit=audit_mapping(source,groups,book_index)
for path in [ROOT/'data/mapping-audit.json',OUT/'mapping-audit.json']:
    path.write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')

# Import the source's explicit smaller units, including discontinuous ranges.
# Do not derive these from the register, which sometimes coarsens a unit's bounds.
child_titles={'54-intro':'The place and audience','541':'The Beatitudes and woes','542':'The standard of righteousness','543':'Six illustrations of righteousness','544':'Giving, prayer, and fasting','545':'Devotion, treasure, and anxiety','546':'Judging others','547':'Prayer and the Golden Rule','548':'The conclusion: two ways and two foundations','64-intro':'Introduction by the sea','641a':'The sower','641b':'The seed growing','641c':'The wheat and tares','641d':'The mustard seed','641e':'The leaven and other parables','642a':'The tares explained','642b':'The hidden treasure','642c':'The pearl of great price','642d':'The net','642e':'The householder'}
subgroups=[]
for section,next_section in [('54','55'),('64','65')]:
    parent=next(g for g in groups if g['id']=='r'+section)
    start=next(i for i,r in enumerate(rows) if re.search(r'^\s*<td[^>]*>\s*<a href="#section'+section+'"',r))
    end=next(i for i,r in enumerate(rows) if re.search(r'^\s*<td[^>]*>\s*<a href="#section'+next_section+'"',r))
    for i in range(start+2,end-1):
        refline=clean(rows[i+1])
        if not re.match(r'^(Matt\.|Mark|Luke|John) \d',refline):continue
        anchor=re.search(r'href="#section([^"]+)"',rows[i])
        key=anchor[1] if anchor else section+'-intro'
        assert key in child_titles,key
        subgroups.append({'id':'r'+key,'section':section+' · '+(key[len(section):] if anchor else 'intro'),'parentId':parent['id'],'title':child_titles[key],'sourceTitle':clean(rows[i]),'sourceRefs':refline,'passages':ranges(refline),'kind':'source-unit','status':'Detailed reference row transcribed from the analytical outline','sourceUrl':parent['sourceUrl'] if anchor is None else parent['sourceUrl'].split('#')[0]+'#section'+key,'notes':parent['notes']})
    parent['subsectionIds']=[g['id'] for g in subgroups if g['parentId']==parent['id']]
assert len(subgroups)==20
groups.extend(subgroups)

# Editorial boundaries within source groups; not attributed to Robertson as units.
selections=[
 ('67-request','67','Jairus asks for help','Matt. 9:18-19; Mark 5:21-24; Luke 8:40-42'),
 ('67-woman','67','The woman is healed','Matt. 9:20-22; Mark 5:25-34; Luke 8:43-48'),
 ('67-daughter','67','Jairus’ daughter is raised','Matt. 9:23-26; Mark 5:35-43; Luke 8:49-56'),
 ('72-feeding','72','The loaves and fish','Matt. 14:15-21; Mark 6:35-44; Luke 9:12-17; John 6:5-13'),
 ('74-water','74','Jesus comes across the water','Matt. 14:25-33; Mark 6:48-52; John 6:19-21'),
 ('85-voice','85','The voice from the cloud','Matt. 17:5-8; Mark 9:7-8; Luke 9:34-36')]
for key,parent_id,title,refs in selections:
    parent=next(g for g in groups if g['id']=='r'+parent_id)
    passages=ranges(refs)
    for passage in passages:
        assert set(passage['refs'])<=set(next(p['refs'] for p in parent['passages'] if p['book']==passage['book']))
    g={'id':'r'+key,'section':parent_id+' · selection','parentId':parent['id'],'title':title,'sourceTitle':'Editorial close reading within Robertson §'+parent_id,'sourceRefs':refs,'passages':passages,'kind':'editorial-unit','status':'Editorial selection within a source grouping; boundaries chosen for close reading','sourceUrl':parent['sourceUrl'],'notes':parent['notes']+[{'label':'About these boundaries','text':'Gospel Atlas selects these verses for a smaller comparison within the source section. Robertson supplies the parent grouping, not these narrower boundaries. The surrounding section remains available for context.','source':'Editorial selection within Robertson §'+parent_id,'url':parent['sourceUrl']}]}
    groups.append(g);parent.setdefault('subsectionIds',[]).append(g['id'])
next(g for g in groups if g['id']=='r55')['notes'].append({'label':'An approach through messengers','text':'Augustine reads Matthew’s account of the centurion approaching Jesus alongside Luke’s description of elders and friends carrying the request. He explains Matthew’s wording as attributing an approach made through representatives to the centurion himself. This is an attributed interpretation of the differing details.','source':'Augustine, Harmony of the Gospels II.20.48–50','url':'https://www.newadvent.org/fathers/1602220.htm'})

focus={'id':'divorce-focus','section':'122','title':'The exception clause','sourceTitle':'Editorial close comparison within Robertson §122','sourceRefs':'Matthew 19:9; Mark 10:11–12','passages':[{'book':'MAT','refs':['19:9']},{'book':'MRK','refs':['10:11','10:12']}],'kind':'focused','status':'Focused selection within a source grouping','sourceUrl':'https://www.gutenberg.org/files/36264/36264-h/36264-h.htm#section122','notes':[{'label':'Compare wording without assuming dependence','text':'This narrower selection follows the requested comparison within Robertson’s broader marriage-and-divorce section. Unmatched words describe this alignment, not additions or deletions by an author.','source':'Editorial selection within Robertson §122','url':'https://www.gutenberg.org/files/36264/36264-h/36264-h.htm#section122'}]}
groups.append(focus)
anoint=[next(g for g in groups if g['id']=='r'+s) for s in ['59','141']]
groups.append({'id':'anointing-related','section':'59 / 141','title':'Compare the anointing accounts','sourceTitle':'Related-episode comparison; not one asserted event','sourceRefs':'Luke 7:36–50; Matthew 26:6–13; Mark 14:3–9; John 12:2–8','passages':anoint[0]['passages']+anoint[1]['passages'],'kind':'related','status':'Related episodes; separate occasions in the cited sources','sourceUrl':anoint[1]['sourceUrl'],'notes':anoint[0]['notes']})
# Reviewed teaching comparisons stay separate from the main source sections.
related_teachings=json.loads((ROOT/'data/related-teachings.json').read_text())
for g in related_teachings:
    assert g['kind']=='related-teaching' and g['notes'] and g['sourceUrl']
    assert len(set(p['book'] for p in g['passages']))==len(g['passages'])
    for p in g['passages']:
        assert any(set(p['refs'])<=set(cp['refs']) for parent in groups if parent['id'] in g['contextIds'] for cp in parent['passages'] if cp['book']==p['book'])
groups.extend(related_teachings)
for g in groups:
    g['pairs']=[{'a':a['book'],'b':b['book'],'relation':'shared-teaching' if g['kind']=='related-teaching' else 'related' if g['kind']=='related' and 'LUK' in [a['book'],b['book']] else ('event-disputed' if (g['id'] in ['r126','r54'] or g.get('parentId')=='r54') and 'LUK' in [a['book'],b['book']] else 'source-group')} for a,b in itertools.combinations(g['passages'],2)]
    for p in g['passages']:
        assert all(any(r in texts[ed][p['book']] for ed in texts) for r in p['refs'])

meta={'revision':'2026-09-28.2','books':book_index,'groups':groups,'sourceSections':source_count,'reviewedReferenceRows':audit['checked'],'referenceAudit':{k:audit[k] for k in ['checked','agree','knownBoundaryVariations']},'editorialUnits':len(selections),'sourceSubsections':len(subgroups),'excludedNonGospelRows':skipped,'editions':[{'id':'BSB','name':'Berean Standard Bible','license':'Public domain','url':'https://berean.bible/terms.htm'},{'id':'ASV','name':'American Standard Version (1901)','license':'Public domain','url':'https://ebible.org/eng-asv/'},{'id':'SBLGNT','name':'SBL Greek New Testament','license':'CC BY 4.0','url':'https://github.com/Faithlife/SBLGNT'}]}
(OUT/'index.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':'))+'\n')
(OUT/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(OUT/'sources.json').write_text((RAW/'manifest.json').read_text())
print(json.dumps({'groups':len(groups),'sourceSections':source_count,'editorialUnits':len(selections),'sourceSubsections':len(subgroups),'referenceAudit':meta['referenceAudit'],'skipped':skipped,'corpus_bytes':sum(p.stat().st_size for p in OUT.glob('*.json'))},indent=2))
