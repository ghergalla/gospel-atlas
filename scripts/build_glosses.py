"""Conservative verse-local attachment of STEP dictionary glosses; never edits Scripture."""
from pathlib import Path
import json,re,unicodedata,hashlib,collections
ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data/sources/step/TAGNT.txt'
COMMIT='b99716b0cddb648ddb95cc786a197180f2f97d48'
# Same lexical boundaries as lib/gospel.ts, including decomposed combining marks.
PAT=re.compile(r"(?:[^\W_]|[\u0300-\u036f])+(?:['’ʼ](?:[^\W\d_]|[\u0300-\u036f])+)*['’ʼ]?")
def key(s):return ''.join(c for c in unicodedata.normalize('NFD',s) if not unicodedata.combining(c)).lower().replace('ς','σ').replace('’',"'").replace('ʼ',"'")
books={'Mat':'MAT','Mrk':'MRK','Luk':'LUK','Jhn':'JHN'}
lookup=collections.defaultdict(lambda:collections.defaultdict(set))
for line in RAW.read_text(encoding='utf-8-sig').splitlines():
    c=line.split('\t');m=re.match(r'^(Mat|Mrk|Luk|Jhn)\.(\d+)\.(\d+)#',c[0])
    if not m or len(c)<6 or 'SBL' not in c[5].split('+'):continue
    form=c[1].split(' (')[0];words=PAT.findall(form)
    if len(words)!=1 or '=' not in c[4]:continue
    lemma,gloss=c[4].split('=',1);strong=c[3].split('=')[0]
    if not lemma or not gloss:continue
    lookup[(books[m[1]],f'{int(m[2])}:{int(m[3])}')][key(words[0])].add((lemma.strip(),gloss.strip(),strong))
corpus=json.loads((ROOT/'public/data/SBLGNT.json').read_text())
entries=[];entryids={};out={};counts={};missing=[]
for b,verses in corpus['books'].items():
    out[b]={};n=matched=ambiguous=0
    for ref,text in verses.items():
        attached=[]
        for i,w in enumerate(PAT.findall(text)):
            n+=1;candidates=lookup[(b,ref)][key(w)]
            if len(candidates)==1:
                e=next(iter(candidates))
                if e not in entryids:entryids[e]=len(entries);entries.append(list(e))
                attached.append(entryids[e]);matched+=1
            else:
                attached.append(None);ambiguous+=len(candidates)>1
                missing.append({'book':b,'ref':ref,'word':i,'form':w,'reason':'ambiguous' if candidates else 'no exact form'})
        out[b][ref]=attached
    counts[b]={'tokens':n,'attached':matched,'ambiguous':ambiguous,'unavailable':n-matched}
meta={'source':'STEP Bible TAGNT / TBESG dictionary-form glosses','url':'https://github.com/STEPBible/STEPBible-Data/tree/'+COMMIT,'license':'CC BY 4.0','commit':COMMIT,'sha256':hashlib.sha256(RAW.read_bytes()).hexdigest(),'method':'Only SBL-labelled rows. Match within the same verse by word form after case, accent, final-sigma and apostrophe normalization. Attach only when all matching rows agree on lemma, dictionary gloss and Strong identifier. No fuzzy or cross-verse fallback. Dictionary glosses are not context-specific translations.','fields':['lemma','gloss','strong'],'counts':counts}
(ROOT/'public/data/greek-glosses.json').write_text(json.dumps({'meta':meta,'entries':entries,'books':out},ensure_ascii=False,separators=(',',':'))+'\n')
(ROOT/'public/data/gloss-validation.json').write_text(json.dumps({**meta,'unavailable':missing},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(counts,indent=2))
