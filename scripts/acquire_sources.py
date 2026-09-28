from pathlib import Path
import urllib.request, json, hashlib, concurrent.futures

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data'/'sources'; RAW.mkdir(parents=True,exist_ok=True)
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GospelAtlas/0.1 (source verification)','Accept':'*/*'}),timeout=45) as r:return r.read()
def save(name,url):
    p=RAW/name
    if not p.exists():p.write_bytes(get(url))
    data=p.read_bytes()
    return {'file':name,'url':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'retrieved':'2026-09-27'}
jobs=[('bsb.txt','https://bereanbible.com/bsb.txt'),('bsb.xlsx','https://bereanbible.com/bsb.xlsx'),('bsb_usx.zip','https://bereanbible.com/bsb_usx.zip'),('asv_usfm.zip','https://ebible.org/Scriptures/eng-asv_usfm.zip'),('asv_usfx.zip','https://ebible.org/Scriptures/eng-asv_usfx.zip'),('robertson-1922.html','https://www.gutenberg.org/files/36264/36264-h/36264-h.htm')]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex: manifest=list(ex.map(lambda job:save(*job),jobs))
commit='c4d241a9c1c479a55b989ba35a4976c1d0b8052c'
cached_tree=RAW/'sblgnt-tree.json'
tree=json.loads(cached_tree.read_text())['tree'] if cached_tree.exists() else json.loads(get(f'https://api.github.com/repos/Faithlife/SBLGNT/git/trees/{commit}?recursive=1'))
(RAW/'sblgnt-tree.json').write_text(json.dumps({'commit':commit,'tree':tree},indent=2))
def greek(item):
    name='sblgnt/'+item['path']; (RAW/name).parent.mkdir(parents=True,exist_ok=True)
    record=save(name,f"https://raw.githubusercontent.com/Faithlife/SBLGNT/{commit}/{item['path']}")
    record['commit']=commit
    return record
selected=[item for item in tree['tree'] if item['type']=='blob' and ((item['path'].startswith('data/sblgnt/') and Path(item['path']).stem in ['Matt','Mark','Luke','John']) or item['path'] in ['LICENSE','README.md','About.md'])]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:manifest.extend(ex.map(greek,selected))
if (RAW/'openbible/manifest.json').exists():
    manifest.extend(json.loads((RAW/'openbible/manifest.json').read_text()))
(RAW/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'files':len(manifest),'bytes':sum(x['bytes'] for x in manifest),'sblgnt_commit':commit,'sblgnt_paths':[x['file'] for x in manifest if x['file'].startswith('sblgnt/')]},indent=2))
