import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCorpusLoader} from '../lib/corpus-loader.ts';
import {readingReducer} from '../lib/reading-state.ts';
import {isSourceSection,isExampleStudy} from '../lib/gospel.ts';

const bsb=JSON.parse(fs.readFileSync(new URL('../public/data/BSB.json',import.meta.url)));
const asv=JSON.parse(fs.readFileSync(new URL('../public/data/ASV.json',import.meta.url)));
const json=value=>new Response(JSON.stringify(value),{status:200});

test('click locks against subsequent previews; another selection switches it; unlock resumes previews',()=>{
  let state={selectedId:'r72',locked:false};
  state=readingReducer(state,{type:'preview',id:'r24'});
  assert.equal(state.previewId,'r24');
  state=readingReducer(state,{type:'select',id:'r24'});
  assert.deepEqual(readingReducer(state,{type:'preview',id:'r25'}),state);
  state=readingReducer(state,{type:'select',id:'r25'});
  assert.deepEqual(state,{selectedId:'r25',locked:true});
  state=readingReducer(state,{type:'unlock'});
  assert.equal(readingReducer(state,{type:'preview',id:'r24'}).previewId,'r24');
  state=readingReducer(state,{type:'restore',id:'r72',locked:true});
  assert.deepEqual(readingReducer(state,{type:'preview',id:'r24'}),state);
});

test('the numbered source list excludes editorial examples and detailed units',()=>{
  const index=JSON.parse(fs.readFileSync(new URL('../public/data/index.json',import.meta.url)));
  assert.equal(index.groups.filter(isSourceSection).length,184);
  assert.deepEqual(index.groups.filter(isExampleStudy).map(g=>g.id),['divorce-focus','anointing-related']);
  assert.ok(index.groups.filter(isSourceSection).every(g=>!isExampleStudy(g)&&!g.parentId));
});

test('a transient HTTP failure recovers automatically and is then cached',async()=>{
  const requests=[];
  const loader=createCorpusLoader(async(url,init)=>{requests.push({url,init});return requests.length===1?new Response('',{status:503}):json(bsb)},{retryDelays:[0,0]});
  assert.equal((await loader.load('BSB')).books.MAT['19:9'],bsb.books.MAT['19:9']);
  assert.equal(requests.length,2);
  assert.equal(requests[1].init.cache,'reload');
  await loader.load('BSB');
  assert.equal(requests.length,2);
});

test('a failed load reports the edition and HTTP status, and explicit retry is a fresh request',async()=>{
  let calls=0;
  const loader=createCorpusLoader(async()=>++calls<=3?new Response('',{status:404}):json(bsb),{retryDelays:[0,0]});
  await assert.rejects(loader.load('BSB'),/BSB.*3 attempts.*HTTP 404/);
  assert.equal((await loader.load('BSB')).edition,'BSB');
  assert.equal(calls,4);
});

test('concurrent requests are deduplicated and editions remain separate when they complete out of order',async()=>{
  const releases=new Map();let calls=0;
  const loader=createCorpusLoader(url=>{calls++;return new Promise(resolve=>releases.set(url,resolve))});
  const one=loader.load('BSB'),duplicate=loader.load('BSB'),two=loader.load('ASV');
  assert.equal(one,duplicate);
  releases.get('./data/ASV.json')(json(asv));
  assert.equal((await two).edition,'ASV');
  releases.get('./data/BSB.json')(json(bsb));
  assert.equal((await one).edition,'BSB');
  assert.equal(calls,2);
});

test('unexpected edition contents are rejected without substituting text',async()=>{
  const loader=createCorpusLoader(async()=>json(bsb),{retryDelays:[]});
  await assert.rejects(loader.load('ASV'),/ASV.*unexpected file contents/);
  await assert.rejects(loader.load('invalid'),/Unknown Bible edition/);
});

test('a stalled request times out with a recoverable error',async()=>{
  const loader=createCorpusLoader((_,init)=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))),{timeoutMs:5,retryDelays:[]});
  await assert.rejects(loader.load('BSB'),/request timed out/);
});
