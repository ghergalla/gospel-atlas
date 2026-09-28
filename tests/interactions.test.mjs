import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {computeWordingPresence} from '../lib/wording-presence.ts';
import {createStatisticsLoader,validStatistics} from '../lib/statistics-loader.ts';
import {makeReading,tokens,isSourceSection} from '../lib/gospel.ts';
const read=name=>JSON.parse(fs.readFileSync(new URL('../public/data/'+name+'.json',import.meta.url)));
const index=read('index'),stats=read('statistics-BSB');

test('phrase highlights retain exact source offsets and every displayed partner has matching word positions',()=>{
 for(const edition of ['BSB','ASV','SBLGNT']){
  const corpus=read(edition),before=JSON.stringify(corpus);
  for(const chapter of [14,19]){
   const passage=makeReading('MAT',chapter,undefined,index).passages[0],presence=computeWordingPresence(index,corpus,passage);
   assert.ok(presence.groups.every(isSourceSection));
   for(const [ref,runs] of Object.entries(presence.verses)){
    const text=corpus.books.MAT[ref];let end=0;
    for(const run of runs){
     assert.ok(run.start>=end&&run.end<=text.length);end=run.end;
     if(!run.books.length)continue;
     const sourceKeys=tokens(text.slice(run.start,run.end)).map(t=>t.key);
     for(const groupId of new Set(run.matches.map(m=>m.groupId)))for(const book of run.books){
      const matches=run.matches.filter(m=>m.book===book&&m.groupId===groupId);if(!matches.length)continue;
      assert.deepEqual(matches.map(m=>tokens(corpus.books[book][m.ref])[m.word].key),sourceKeys);
      for(let i=1;i<matches.length;i++){assert.equal(matches[i].ref,matches[i-1].ref);assert.equal(matches[i].word,matches[i-1].word+1)}
     }
    }
   }
  }
  assert.equal(JSON.stringify(corpus),before);
 }
});
test('a chapter can lead into two, three or four Gospel readings without including related-occasion examples',()=>{
 const corpus=read('BSB'),presence=computeWordingPresence(index,corpus,makeReading('MAT',14,undefined,index).passages[0]);
 for(const count of [1,2,3])assert.ok(Object.values(presence.verses).flat().some(r=>r.books.length===count));
 const anointing=computeWordingPresence(index,corpus,makeReading('LUK',7,undefined,index).passages[0]);
 assert.ok(!anointing.groups.some(g=>g.id==='anointing-related'));
 assert.ok(!(anointing.verses['7:37']||[]).some(r=>r.matches.some(m=>m.book==='MAT'&&m.ref.startsWith('26:'))));
});
test('statistics loading rejects stale revisions, refreshes the request, and deduplicates concurrent loads',async()=>{
 const calls=[];const loader=createStatisticsLoader(async(url,init)=>{calls.push({url,cache:init.cache});return Response.json(calls.length===1?{...stats,revision:'stale'}:stats)},{retryDelays:[0]});
 const [a,b]=await Promise.all([loader.load(index,'BSB'),loader.load(index,'BSB')]);assert.equal(a,b);assert.equal(calls.length,2);assert.equal(new URL(calls[0].url,'https://example.test/gospel-atlas/').searchParams.get('rev'),index.revision);assert.equal(calls[1].cache,'reload');assert.equal(a.calculated,false);
 assert.equal(await loader.load(index,'BSB'),a);assert.equal(calls.length,2);
});
test('failed statistics can recover from verified text, while a failed retry is evicted for the next attempt',async()=>{
 const loader=createStatisticsLoader(async()=>new Response('',{status:503}),{retryDelays:[]});
 await assert.rejects(loader.load(index,'BSB'),/HTTP 503/);
 const result=await loader.load(index,'BSB',async()=>stats);assert.equal(result.calculated,true);assert.deepEqual(result.stats,stats);
});
test('statistics validation checks edition, revision, pair completeness, and source rows',()=>{
 assert.equal(validStatistics(stats,index,'BSB'),true);assert.equal(validStatistics(stats,index,'ASV'),false);
 assert.equal(validStatistics({...stats,pairs:stats.pairs.slice(1)},index,'BSB'),false);
 const bad=structuredClone(stats);bad.pairs[0].rows[0].id='invented';assert.equal(validStatistics(bad,index,'BSB'),false);
 assert.equal(validStatistics({...stats,method:undefined},index,'BSB'),false);
 assert.equal(validStatistics({...stats,method:'unfiltered-lcs'},index,'BSB'),false);
});

test('a focused reading only highlights the selected comparison and does not import broader section matches',()=>{
 const corpus=read('BSB'),group=index.groups.find(g=>g.id==='divorce-focus');
 for(const passage of group.passages){
  const presence=computeWordingPresence(index,corpus,passage,group);
  assert.deepEqual(presence.groups.map(g=>g.id),[group.id]);
  for(const run of Object.values(presence.verses).flat())for(const match of run.matches){
   assert.equal(match.groupId,group.id);
   assert.ok(group.passages.find(p=>p.book===match.book).refs.includes(match.ref));
  }
 }
});
test('a statistics timeout aborts and exposes a retryable failure',async()=>{
 const loader=createStatisticsLoader((_url,init)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))),{timeoutMs:5,retryDelays:[]});
 await assert.rejects(loader.load(index,'BSB'),/timed out/);
});
