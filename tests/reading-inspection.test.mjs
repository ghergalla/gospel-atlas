import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyInspection,inspectionKey,inspectionReducer,highlightedWords,parallelGroups,partnerBooks,directTargets,wordKey} from '../lib/reading-inspection.ts';
import {computeWordingPresence} from '../lib/wording-presence.ts';
import {tokens,align,passageText,makeReading} from '../lib/gospel.ts';
const read=name=>JSON.parse(fs.readFileSync(new URL('../public/data/'+name+'.json',import.meta.url)));
const index=read('index');

test('a held selection ignores incidental previews, can be replaced deliberately, and dismisses completely',()=>{
 const a={edition:'BSB',book:'MAT',ref:'19:9',word:0},b={...a,book:'MRK',ref:'10:11'};
 let state=inspectionReducer(emptyInspection,{type:'preview',target:a});
 assert.equal(state.phase,'preview');
 assert.equal(inspectionReducer(state,{type:'open',key:inspectionKey(b)}),state,'a stale hover timer must not open the wrong card');
 state=inspectionReducer(state,{type:'open',key:inspectionKey(a)});assert.equal(state.phase,'open');
 state=inspectionReducer(state,{type:'pin',target:a});
 assert.equal(inspectionReducer(state,{type:'preview',target:b}),state);
 state=inspectionReducer(state,{type:'pin',target:b});assert.equal(state.target,b);
 assert.deepEqual(inspectionReducer(state,{type:'dismiss'}),emptyInspection);
});
test('hover follows direct linked positions only, in the same edition, without following target runs transitively',()=>{
 const corpus=read('BSB'),group=index.groups.find(g=>g.id==='r72'),p=group.passages.find(p=>p.book==='MAT');
 const presence=computeWordingPresence(index,corpus,p,group);
 for(const [ref,runs] of Object.entries(presence.verses))for(const run of runs.filter(r=>r.books.length)){
  const source=tokens(corpus.books.MAT[ref]),word=source.findIndex(t=>t.start===run.start),target={edition:'BSB',book:'MAT',ref,word,run};
  const expected=new Set([...source.flatMap((t,word)=>t.start>=run.start&&t.end<=run.end?[wordKey({...target,word})]:[]),...run.matches.map(wordKey)]);
  assert.deepEqual(highlightedWords(target,corpus),expected);
  assert.equal(highlightedWords({...target,edition:'SBLGNT'},corpus).size,0);
  for(const book of run.books)assert.ok(directTargets(target,group.id,book).length);
 }
 const target={edition:'BSB',book:'MAT',ref:'14:18',word:0};
 assert.deepEqual([...highlightedWords(target,corpus)],[wordKey(target)]);
});
test('card mappings apply to the selected verse, not merely another part of the chapter',()=>{
 const corpus=read('SBLGNT'),p=makeReading('MAT',19,undefined,index).passages[0],presence=computeWordingPresence(index,corpus,p);
 const target={edition:'SBLGNT',book:'MAT',ref:'19:9',word:12};
 assert.ok(parallelGroups(target,presence).some(g=>g.id==='r122'));
 for(const g of parallelGroups(target,presence)){
  assert.ok(g.passages.some(p=>p.book==='MAT'&&p.refs.includes('19:9')));
  assert.ok(!partnerBooks(g,target).includes('MAT'));
 }
});
test('underlines and unmatched emphasis use identical supported positions, including cross-verse phrases',()=>{
 for(const edition of ['BSB','ASV','SBLGNT'])for(const id of ['r72','r122','divorce-focus']){
  const corpus=read(edition),group=index.groups.find(g=>g.id===id);
  for(const pair of group.pairs){
   const a=group.passages.find(p=>p.book===pair.a),b=group.passages.find(p=>p.book===pair.b),d=align(passageText(a,corpus),passageText(b,corpus),true);
   for(const [source,partner,side] of [[a,b,0],[b,a,1]]){
    const presence=computeWordingPresence(index,corpus,source,group);let base=0;const marked=[];
    for(const ref of source.refs){
     const words=tokens(corpus.books[source.book][ref]||'');
     words.forEach((w,i)=>{if(presence.verses[ref].some(r=>r.books.includes(partner.book)&&r.start<=w.start&&r.end>=w.end))marked.push(base+i)});base+=words.length;
    }
    assert.deepEqual(marked,d.pairs.map(p=>p[side]),edition+' '+id+' '+source.book+' → '+partner.book);
   }
  }
 }
});
test('the unrelated And in Mark 10:12 remains unlinked to Matthew 19:12',()=>{
 const corpus=read('BSB'),group=index.groups.find(g=>g.id==='r122'),p=group.passages.find(p=>p.book==='MRK'),presence=computeWordingPresence(index,corpus,p,group);
 const run=presence.verses['10:12'][0];assert.equal(run.books.length,0);
});
