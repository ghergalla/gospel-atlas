import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {searchPassages,firstSearchResult} from '../lib/passage-search.ts';
const read=name=>JSON.parse(fs.readFileSync(new URL('../public/data/'+name+'.json',import.meta.url)));
const index=read('index'),bsb=read('BSB');

test('reference search takes priority and preserves chapter or verse boundaries',()=>{
 const chapter=firstSearchResult(searchPassages(index,bsb,'Matthew 14'));
 assert.equal(chapter.id,'read-MAT-14');
 assert.deepEqual(chapter.passages[0].refs,Object.keys(bsb.books.MAT).filter(r=>r.startsWith('14:')));
 assert.deepEqual(firstSearchResult(searchPassages(index,bsb,'Jn. 3:16')).passages,[{book:'JHN',refs:['3:16']}]);
 assert.equal(firstSearchResult(searchPassages(index,bsb,'Matthew 99:99')),undefined);
});

test('passage titles and related teachings work before edition text finishes loading',()=>{
 const a=searchPassages(index,undefined,"Lord's prayer"),b=searchPassages(index,undefined,'Lord’s prayer');
 assert.ok(a.teachings.length>0);assert.deepEqual(a,b);
 assert.equal(firstSearchResult(a).kind,'related-teaching');
 const browse=searchPassages(index,undefined,'');
 assert.equal(browse.sections.length,184);assert.equal(browse.verses.length,0);
 assert.equal(searchPassages(index,bsb,'ab').verses.length,0);
});

test('keyword search covers all four Gospels, caps displayed verses, and retains the full result count',()=>{
 const result=searchPassages(index,bsb,'Jesus');
 const expected=Object.values(bsb.books).reduce((n,book)=>n+Object.values(book).filter(t=>t.toLowerCase().includes('jesus')).length,0);
 assert.equal(result.verseCount,expected);assert.equal(result.verses.length,20);
 assert.ok(searchPassages(index,bsb,'Lazarus').verses.some(v=>v.group.passages[0].book==='JHN'));
 assert.equal(searchPassages(index,bsb,'no_such_passage_237').verseCount,0);
});

test('search normalization never changes quoted Scripture, including Greek accents',()=>{
 for(const [edition,query] of [['BSB','bread'],['ASV','bread'],['SBLGNT','λογος']]){
  const corpus=read(edition),before=JSON.stringify(corpus),result=searchPassages(index,corpus,query);
  assert.ok(result.verses.length>0);
  for(const item of result.verses){const passage=item.group.passages[0];assert.equal(item.text,corpus.books[passage.book][passage.refs[0]])}
  assert.equal(JSON.stringify(corpus),before);
 }
 const greek=read('SBLGNT');
 assert.deepEqual(searchPassages(index,greek,'λογος'),searchPassages(index,greek,'λόγος'));
});

test('rendered search snippets preserve source text and failures expose a text-search retry',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'silent'});
 try{
  const {PassageSearchResults}=await server.ssrLoadModule('/components/passage-search-results.tsx');
  const props={id:'test-search',result:searchPassages(index,bsb,'bread'),selectedId:'r72',edition:'BSB',textReady:true,onRetry:()=>{},onSelect:()=>{}};
  const html=renderToStaticMarkup(createElement(PassageSearchResults,props));
  const snippets=[...html.matchAll(/<span class="search-snippet">([\s\S]*?)<\/span>/g)].map(m=>m[1].replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
  assert.deepEqual(snippets,props.result.verses.map(v=>v.text));
  const error=renderToStaticMarkup(createElement(PassageSearchResults,{...props,result:searchPassages(index,undefined,'bread'),textReady:false,textError:'HTTP 503'}));
  assert.match(error,/Retry text search/);assert.doesNotMatch(error,/No matches found/);
 }finally{await server.close()}
});
