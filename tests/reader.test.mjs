import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {passageText} from '../lib/gospel.ts';

const read=name=>JSON.parse(fs.readFileSync(new URL('../public/data/'+name+'.json',import.meta.url)));
const index=read('index'),noop=()=>{};
const textFromHtml=html=>html.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/g,'').replace(/<p class="verse-absent"[^>]*>[\s\S]*?<\/p>/g,'').replace(/<[^>]*>/g,'').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim();

test('the rendered reader preserves exact Scripture in every highlighting style and selected Gospel order',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'silent'});
 try{
  const {Reader}=await server.ssrLoadModule('/components/passage-reader.tsx');
  const groups=['r122','r72','divorce-focus'].map(id=>index.groups.find(g=>g.id===id));
  groups.push(index.groups.find(g=>g.kind==='related-teaching'));
  for(const edition of ['BSB','ASV','SBLGNT'])for(const group of groups)for(const count of group.id==='r72'?[1,2,3,4]:[group.passages.length])for(const style of ['shared','plain','differences']){
   const corpus=read(edition),books=group.passages.map(p=>p.book).reverse().slice(0,count);
   const html=renderToStaticMarkup(createElement(Reader,{group,index,books,corpus,tab:style==='differences'?'differences':'text',setTab:noop,wide:true,settings:{pair:'',normalized:true,emphasis:'all'},setSettings:noop,onNavigate:noop,onRetryText:noop,editionForReader:edition,parallel:'',setParallel:noop,wording:style==='shared',setWording:noop,onParallel:noop}));
   const rendered=[...html.matchAll(/<div class="scripture[^\"]*"[^>]*>([\s\S]*?)<\/div>/g)].map(m=>textFromHtml(m[1]));
   const expected=group.passages.filter(p=>books.includes(p.book)).sort((a,b)=>books.indexOf(a.book)-books.indexOf(b.book)).map(p=>passageText(p,corpus));
   assert.deepEqual(rendered,expected,edition+' '+group.id+' '+count+' '+style);
   assert.equal((html.match(/role="tab"/g)||[]).length,2);
   assert.match(html,/Sources &amp; context/);
   assert.match(html,/Parallel wording/);
   assert.doesNotMatch(html,/aria-label="Reading highlights"/);
   assert.match(html,/aria-label="Second Bible edition"/);
   assert.match(html,new RegExp('data-count="'+expected.length+'"'));
  }
 }finally{await server.close()}
});

test('Greek meaning cards use the exact sourced gloss for both matched and unmatched words, and leave missing meanings unavailable',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'silent'});
 try{
  const {EnglishMeaning}=await server.ssrLoadModule('/components/reading-inspection-card.tsx');
  const corpus=read('SBLGNT'),glosses=read('greek-glosses'),base={edition:'SBLGNT',book:'MAT',ref:'19:9',word:12};
  const meaning=glosses.entries[glosses.books.MAT['19:9'][12]][1];
  const without=renderToStaticMarkup(createElement(EnglishMeaning,{target:base,corpus,glosses,error:false,onRetry:noop}));
  const withMatch=renderToStaticMarkup(createElement(EnglishMeaning,{target:{...base,run:{start:0,end:1,books:['MRK'],matches:[]}},corpus,glosses,error:false,onRetry:noop}));
  assert.equal(withMatch,without);assert.ok(textFromHtml(without).includes(meaning));
  const missing={...glosses,books:{MAT:{'19:9':[]}}};
  assert.match(renderToStaticMarkup(createElement(EnglishMeaning,{target:base,corpus,glosses:missing,error:false,onRetry:noop})),/No verified English meaning/);
  assert.match(renderToStaticMarkup(createElement(EnglishMeaning,{target:base,corpus,error:true,onRetry:noop})),/Retry meanings/);
 }finally{await server.close()}
});
