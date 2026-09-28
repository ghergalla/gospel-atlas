"use client";
import {useRef} from 'react';
import {Columns3,Orbit,Unlock,LockKeyhole,BookOpen,X,ChevronLeft,ChevronRight} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {PassageMap} from '@/components/passage-map';
import {NAMES,refLabel,makeReading,isSourceSection} from '@/lib/gospel';
import type {Index,Group} from '@/lib/gospel';

type Props={open:boolean;onOpenChange:(v:boolean)=>void;index:Index;books:string[];group:Group;groups:Group[];displayed:Group;preview?:Group;locked:boolean;view:'columns'|'circle';scale:string;onView:(v:'columns'|'circle')=>void;onSelect:(g:Group)=>void;onPreview:(g:Group)=>void;onUnlock:()=>void;onRead:()=>void;onAfterRead:()=>void};
export function ExploreMap(p:Props){
 const sequence=p.groups.filter(isSourceSection);const step=(n:number)=>{const i=sequence.findIndex(g=>g.id===(p.displayed.parentId||p.displayed.id));if(sequence.length)p.onSelect(sequence[i<0?(n>0?0:sequence.length-1):(i+n+sequence.length)%sequence.length])};
 const readOnClose=useRef(false),returnFocus=useRef<HTMLElement|null>(null);
 // Replace the centered popup utilities at the call site. Production CSS can
 // fold `translate: none` into `transform: none`, leaving individual offsets.
 return <Dialog open={p.open} onOpenChange={p.onOpenChange}><DialogContent className="explore-dialog top-0 left-0 translate-x-0 translate-y-0" showCloseButton={false} onOpenAutoFocus={e=>{e.preventDefault();returnFocus.current=document.activeElement as HTMLElement;document.querySelector<HTMLButtonElement>('.explore-close')?.focus()}} onCloseAutoFocus={e=>{e.preventDefault();if(readOnClose.current){readOnClose.current=false;requestAnimationFrame(p.onAfterRead)}else returnFocus.current?.focus()}} onEscapeKeyDown={e=>{if(p.locked){e.preventDefault();p.onUnlock()}}}>
 <header className="explore-header"><div><DialogTitle>Explore</DialogTitle><DialogDescription>{p.books.map(b=>NAMES[b]).join(' · ')}</DialogDescription></div><button className="icon-button explore-close" aria-label="Exit full screen" onClick={()=>p.onOpenChange(false)}><X size={22}/></button></header>
 <div className="explore-toolbar"><div className="explore-views" role="group" aria-label="Full screen visualization"><button aria-pressed={p.view==='columns'} onClick={()=>p.onView('columns')}><Columns3 size={16}/>Columns</button><button aria-pressed={p.view==='circle'} onClick={()=>p.onView('circle')}><Orbit size={16}/>Circle</button></div><button className="scrub-toggle" onClick={()=>p.locked?p.onUnlock():p.onSelect(p.displayed)}>{p.locked?<Unlock size={16}/>:<LockKeyhole size={16}/>}{p.locked?'Resume':'Hold'}</button></div>
 <p className="explore-instructions" id="explore-instructions">Drag to explore · lift to hold</p>
 <div className="explore-canvas" aria-describedby="explore-instructions"><PassageMap index={p.index} books={p.books} group={p.group} groups={p.groups} preview={p.preview} locked={p.locked} onSelect={p.onSelect} onPreview={p.onPreview} onRead={(b,c)=>p.onSelect(makeReading(b,c,undefined,p.index)!)} onUnlock={p.onUnlock} view={p.view} scale={p.scale} zoom={1} focus={false} immersive/></div>
 <footer className="explore-selection"><div className="explore-selection-heading"><span className="overline">{p.locked?'PASSAGE HELD':'EXPLORING'}</span><div className="explore-reading-actions"><button className="icon-button" aria-label="Previous source passage" onClick={()=>step(-1)}><ChevronLeft size={18}/></button><button className="icon-button" aria-label="Next source passage" onClick={()=>step(1)}><ChevronRight size={18}/></button><button className="read-selection" onClick={()=>{readOnClose.current=true;p.onRead()}}><BookOpen size={17}/>Read</button></div></div><h2>{p.displayed.title}</h2><p>{p.displayed.passages.filter(v=>p.books.includes(v.book)).sort((a,b)=>p.books.indexOf(a.book)-p.books.indexOf(b.book)).map(refLabel).join(' · ')}</p></footer>
 </DialogContent></Dialog>;
}
