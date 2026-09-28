import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tokens,align,passageText,isSourceSection} from '../lib/gospel.ts';
import {computeStatistics} from '../lib/lexical-statistics.ts';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const index=read('public/data/index.json');
test('all exported wording statistics reproduce from source text and partition unique Gospel positions',()=>{
 for(const ed of ['BSB','ASV','SBLGNT']){
  const c=read('public/data/'+ed+'.json'),s=read('public/data/statistics-'+ed+'.json');assert.deepEqual(s,computeStatistics(index,c));
  for(const p of s.pairs){for(const side of [p.left,p.right]){assert.equal(side.matched+side.unmatched+side.unexamined+side.outside,side.total);assert.equal(side.examined,side.matched+side.unmatched)}
   for(const row of p.rows){assert.ok(isSourceSection(index.groups.find(g=>g.id===row.id)));assert.equal(row.limited,false);assert.ok(row.score>=0&&row.score<=1)}
  }
 }
});
test('editorial subunits stay inside their source section and are explicitly labelled',()=>{
 const units=index.groups.filter(g=>g.kind==='editorial-unit');assert.equal(units.length,6);
 for(const g of units){const parent=index.groups.find(p=>p.id===g.parentId);for(const p of g.passages)for(const ref of p.refs)assert.ok(parent.passages.find(v=>v.book===p.book).refs.includes(ref));assert.match(g.status,/Editorial/)}
});
test('every Greek gloss has a word position and is an unaltered source dictionary field',()=>{
 const c=read('public/data/SBLGNT.json'),gl=read('public/data/greek-glosses.json');
 const raw=fs.readFileSync(new URL('../data/sources/step/TAGNT.txt',import.meta.url),'utf8');const lookup=new Map();
 const books={Mat:'MAT',Mrk:'MRK',Luk:'LUK',Jhn:'JHN'};
 for(const line of raw.split('\n')){const cells=line.split('\t'),m=cells[0].match(/^(Mat|Mrk|Luk|Jhn)\.(\d+)\.(\d+)#/);if(!m||!cells[5]?.split('+').includes('SBL')||!cells[4].includes('='))continue;
  const form=tokens(cells[1].split(' (')[0]);if(form.length!==1)continue;
  const eq=cells[4].indexOf('='),entry=[cells[4].slice(0,eq).trim(),cells[4].slice(eq+1).trim(),cells[3].split('=')[0]];
  const key=[books[m[1]],Number(m[2])+':'+Number(m[3]),form[0].key].join('|');if(!lookup.has(key))lookup.set(key,new Set());lookup.get(key).add(JSON.stringify(entry));
 }
 for(const [book,verses] of Object.entries(c.books))for(const [ref,text] of Object.entries(verses)){
  const ts=tokens(text),entries=gl.books[book][ref];assert.equal(entries.length,ts.length,book+' '+ref);
  entries.forEach((id,i)=>{if(id===null)return;const choices=lookup.get([book,ref,ts[i].key].join('|'));assert.equal(choices.size,1);assert.ok(choices.has(JSON.stringify(gl.entries[id])))});
 }
});
