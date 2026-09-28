"use client";
import {ArrowUpRight} from 'lucide-react';
import {isRelatedTeaching,NAMES} from '@/lib/gospel';
import type {Group,Index} from '@/lib/gospel';

export function RelatedTeachings({group,index,books,onOpen,onNavigate,onEvidence}:{group:Group;index:Index;books:string[];onOpen:(g:Group,books:string[])=>void;onNavigate:(g:Group)=>void;onEvidence:()=>void}){
 const related=index.groups.filter(g=>isRelatedTeaching(g)&&g.id!==group.id&&g.passages.some(p=>group.passages.some(current=>current.book===p.book&&p.refs.some(ref=>current.refs.includes(ref)))));
 const selected=isRelatedTeaching(group);
 if(!selected&&!related.length)return null;
 return <div className="related-teachings">
  {selected?<>
   <div className="related-teaching-caption"><span>{group.status}</span><button className="text-button" onClick={onEvidence}>Sources & context<ArrowUpRight size={13}/></button></div>
   <div className="teaching-context-links">{group.contextIds?.map(id=>{const context=index.groups.find(g=>g.id===id);return context&&<button key={id} className="text-button" onClick={()=>onNavigate(context)}>Read context · {context.passages.map(p=>NAMES[p.book]).join(' / ')}<ArrowUpRight size={13}/></button>})}</div>
  </>:related.map(g=><button className="related-teaching-link" key={g.id} onClick={()=>{const involved=g.passages.map(p=>p.book);onOpen(g,[...books.filter(b=>involved.includes(b)),...involved.filter(b=>!books.includes(b))])}}>Compare {g.title.replace(/^The /,'the ')}<ArrowUpRight size={15}/></button>)}
 </div>;
}
