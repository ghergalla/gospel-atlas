"use client";
import {ArrowUpRight,BookOpen} from 'lucide-react';
import {COLORS,refLabel} from '@/lib/gospel';
import type {Group} from '@/lib/gospel';
import type {PassageSearchResult} from '@/lib/passage-search';

type Props={id:string;result:PassageSearchResult;selectedId:string;edition:string;textReady:boolean;textError?:string;onRetry:()=>void;onSelect:(g:Group)=>void};
export function PassageSearchResults(p:Props){
 const r=p.result,count=r.sections.length+r.teachings.length+r.studies.length+r.verseCount+(r.direct?1:0);
 const groupButton=(g:Group)=><button key={g.id} className={'passage-result '+(g.id===p.selectedId?'active':'')} onClick={()=>p.onSelect(g)}><span><strong>{g.title}</strong><span className="result-references">{g.passages.map(v=><span key={v.book}><i style={{background:COLORS[v.book]}}/>{refLabel(v)}</span>)}</span>{g.kind==='disputed'&&<span className="result-note">Interpretive note</span>}</span><ArrowUpRight size={14}/></button>;
 return <div id={p.id} className="passage-search-results" onKeyDown={e=>{
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
  const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('.passage-result'));
  const current=buttons.indexOf(e.target as HTMLButtonElement);if(current<0)return;
  e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,current+(e.key==='ArrowDown'?1:-1)));buttons[next]?.focus();
 }}>
 <p className="search-result-status" role="status">{r.query?`${count} result${count===1?'':'s'}${r.verseCount>20?' · first 20 text matches shown':''}`:'Browse passages or search above'}</p>
 {r.direct&&<button className="passage-result direct-result" onClick={()=>p.onSelect(r.direct!)}><BookOpen size={18}/><span><strong>{r.direct.title}</strong><span className="result-note">Open this reference</span></span><ArrowUpRight size={15}/></button>}
 {r.teachings.length>0&&<section><h3 className="search-section-title">Related teachings</h3>{r.teachings.map(groupButton)}</section>}
 {r.sections.length>0&&<section><h3 className="search-section-title">{r.query?'Passages':'Source sections'}</h3>{r.sections.map(groupButton)}</section>}
 {r.studies.length>0&&<section><h3 className="search-section-title">Example studies</h3>{r.studies.map(groupButton)}</section>}
 {r.verses.length>0&&<section><h3 className="search-section-title">Text matches · {p.edition}</h3>{r.verses.map(v=><button className="passage-result" key={v.group.id} onClick={()=>p.onSelect(v.group)}><span><strong>{v.group.title}</strong><span className="search-snippet">{v.text}</span></span><ArrowUpRight size={14}/></button>)}</section>}
 {r.query.length>=3&&!p.textReady&&<p className="search-help" role="status">{p.textError?'Text search is temporarily unavailable.':'Loading '+p.edition+' for text search…'}{p.textError&&<button className="text-button" onClick={p.onRetry}>Retry text search</button>}</p>}
 {r.query&&count===0&&(p.textReady||r.query.length<3)&&<p className="search-help">No matches found. Try “Matthew 14”, “Lord’s prayer”, or a word from the selected edition.</p>}
 {r.query.length>0&&r.query.length<3&&<p className="search-help">Type at least 3 characters to search the Bible text.</p>}
 </div>;
}
