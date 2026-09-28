import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {align,alignmentSpans,sourceExcerpt,passageText,makeReading,parseReading,refLabel,isSourceSection,tokens} from '../lib/gospel.ts';

const index=JSON.parse(fs.readFileSync(new URL('../public/data/index.json',import.meta.url)));
const bsb=JSON.parse(fs.readFileSync(new URL('../public/data/BSB.json',import.meta.url)));
const group=id=>index.groups.find(g=>g.id===id);

test('the focused comparison keeps the exception clause unmatched',()=>{
  const g=group('divorce-focus');
  const diff=align(...g.passages.map(p=>passageText(p,bsb)));
  const matched=new Set(diff.pairs.map(p=>p[0]));
  const unmatched=diff.x.filter((_,i)=>!matched.has(i)).map(t=>t.text).join(' ');
  assert.match(unmatched,/except for sexual immorality/);
  assert.equal(diff.pairs.length,10);
  assert.equal(diff.y.length-diff.pairs.length,20);
  assert.equal(diff.limited,false);
});

test('Greek normalization affects comparison without changing source tokens',()=>{
  const a='λόγος καὶ θεός',b='ΛΟΓΟΣ και θεος';
  assert.equal(align(a,b,true).pairs.length,3);
  assert.equal(align(a,b,false).pairs.length,0);
  assert.equal(align(a,b).x[0].text,'λόγος');
});

test('isolated words and connector-only fragments stay unlinked, while connectors inside phrases remain',()=>{
  for(const [a,b] of [['one two one','one one'],['bread and wine','fish and water'],['bread and the wine','fish and the water'],['ἄρτος καὶ ὁ οἶνος','ἰχθὺς καὶ ὁ ὕδωρ']])assert.deepEqual(align(a,b).pairs,[],`${a} / ${b}`);
  const d=align('Bread and wine.','Take bread and wine!');
  assert.deepEqual(d.pairs,[[0,1],[1,2],[2,3]]);
  assert.equal(d.x.map(t=>'Bread and wine.'.slice(t.start,t.end)).join(' '),'Bread and wine');
});

test('Matthew 19:12 does not acquire an incidental link to Mark 10:12',()=>{
  const g=group('r122');
  for(const edition of ['BSB','ASV','SBLGNT']){
    const corpus=JSON.parse(fs.readFileSync(new URL('../public/data/'+edition+'.json',import.meta.url)));
    const passages=['MAT','MRK'].map(book=>g.passages.find(p=>p.book===book));
    const positions=passages.map(p=>p.refs.flatMap(ref=>tokens(corpus.books[p.book][ref]).map(t=>({ref,text:t.text}))));
    const d=align(...passages.map(p=>passageText(p,corpus)));
    assert.ok(!d.pairs.some(([a,b])=>positions[0][a].ref==='19:12'&&positions[1][b].ref==='10:12'),edition);
    assert.ok(d.pairs.some(([a,b])=>positions[0][a].ref==='19:9'&&positions[1][b].ref==='10:11'),edition);
    assert.ok(alignmentSpans(d).filter(s=>s.kind==='shared').every(s=>s.a.end-s.a.start>=2));
  }
});

test('reordering Gospel columns preserves the same matched positions and exact source tokens',()=>{
  for(const edition of ['BSB','ASV','SBLGNT']){
    const corpus=JSON.parse(fs.readFileSync(new URL('../public/data/'+edition+'.json',import.meta.url)));
    for(const id of ['r72','r122','divorce-focus']){
      const [a,b]=group(id).passages.slice(0,2).map(p=>passageText(p,corpus));
      const ab=align(a,b),ba=align(b,a);
      assert.deepEqual(ab.pairs,ba.pairs.map(([x,y])=>[y,x]),edition+' '+id);
      assert.deepEqual(ab.x,tokens(a));assert.deepEqual(ab.y,tokens(b));
    }
  }
});

test('chapter-spanning and chapter-list source references remain complete',()=>{
  assert.deepEqual(group('r128a').passages[0].refs,['11:55','11:56','11:57','12:1','12:9','12:10','12:11']);
  assert.equal(group('r150').passages[0].refs.length,60);
  assert.equal(group('r150').passages[0].refs.at(-1),'16:33');
  assert.equal(index.sourceSections,184);
  for(const g of index.groups)for(const p of g.passages){
    assert.equal(new Set(p.refs).size,p.refs.length);
    for(const r of p.refs)assert.ok(index.books.find(b=>b.id===p.book).verses.some(v=>v.ref===r),`${g.id}: ${p.book} ${r}`);
  }
});

test('event disagreement belongs to the relevant pair, not every pair',()=>{
  for(const p of group('r126').pairs)assert.equal(p.relation,[p.a,p.b].includes('LUK')?'event-disputed':'source-group');
  for(const p of group('anointing-related').pairs)assert.equal(p.relation,[p.a,p.b].includes('LUK')?'related':'source-group');
});

test('reference navigation rejects nonexistent passages and keeps exact boundaries',()=>{
  assert.equal(parseReading('John 3:16',index).id,'read-JHN-3-16');
  assert.equal(parseReading('John 22',index),undefined);
  assert.equal(parseReading('Matthew 19:999',index),undefined);
  const g=makeReading('MRK',10,undefined,index);
  assert.equal(refLabel(g.passages[0]),'Mark 10:1–52');
  assert.ok(!bsb.books.LUK['9:33'].includes('vvv'));
});

test('the import release has no unresolved format discrepancies',()=>{
  const report=JSON.parse(fs.readFileSync(new URL('../data/import-validation.json',import.meta.url)));
  assert.deepEqual(report.discrepancies,[]);
  assert.equal(report.checks.length,12);
  assert.ok(report.rejectedBsbUsx.differences.some(d=>d.book==='LUK'&&d.ref==='9:33'));
});

test('source-reference audit accounts for every main section and exposes its boundary decision',()=>{
  const audit=JSON.parse(fs.readFileSync(new URL('../data/mapping-audit.json',import.meta.url)));
  assert.equal(audit.checks.length,184);
  assert.equal(audit.agree,183);
  assert.deepEqual(audit.checks.filter(c=>c.status!=='agreement').map(c=>c.groupId),['r54']);
  assert.deepEqual(audit.checks.find(c=>c.groupId==='r54').differences,{MAT:{outlineOnly:[],registerOnly:['8:1']}});
  assert.ok(!group('r54').passages.find(p=>p.book==='MAT').refs.includes('8:1'));
  assert.ok(group('r548').passages.find(p=>p.book==='MAT').refs.includes('8:1'));
});

test('detailed source units preserve discontinuous boundaries and stay outside the overview baseline',()=>{
  const detailed=index.groups.filter(g=>g.kind==='source-unit');
  assert.equal(detailed.length,20);
  assert.equal(index.groups.filter(isSourceSection).length,184);
  assert.deepEqual(group('r543').passages.find(p=>p.book==='LUK').refs,['6:27','6:28','6:29','6:30','6:32','6:33','6:34','6:35','6:36']);
  assert.deepEqual(group('r547').passages.find(p=>p.book==='LUK').refs,['6:31']);
  for(const g of detailed)assert.ok(group(g.parentId).subsectionIds.includes(g.id));
});

test('phrase spans cover every original token exactly once, including repeated words and Greek accents',()=>{
  for(const [a,b] of [['one, two one!','one one'],['λόγος καὶ θεός','ΛΟΓΟΣ θεος'],['one two','three four'],['','text'],group('divorce-focus').passages.map(p=>passageText(p,bsb))]){
    const d=align(a,b),spans=alignmentSpans(d);
    for(const [side,ts,text] of [['a',d.x,a],['b',d.y,b]]){
      const covered=spans.flatMap(s=>s[side]?Array.from({length:s[side].end-s[side].start},(_,i)=>s[side].start+i):[]);
      assert.deepEqual(covered,[...ts.keys()]);
      for(const s of spans.filter(s=>s[side]))assert.equal(sourceExcerpt(text,ts,s[side]),text.slice(ts[s[side].start].start,ts[s[side].end-1].end));
    }
    for(const s of spans.filter(s=>s.kind==='shared'))assert.deepEqual(d.x.slice(s.a.start,s.a.end).map(t=>t.key),d.y.slice(s.b.start,s.b.end).map(t=>t.key));
  }
  assert.deepEqual(alignmentSpans({x:[],y:[],pairs:[],limited:true}),[]);
});
