"use client";
import {useEffect,useRef,useState} from 'react';
import {NAMES,COLORS,tokens,refLabel} from '@/lib/gospel';
import type {Passage,Corpus,WordRange} from '@/lib/gospel';
import type {WordingPresence} from '@/lib/wording-presence';
import {wordingLineStyle} from '@/lib/wording-style';
import {wordKey} from '@/lib/reading-inspection';
import type {ReadingTarget} from '@/lib/reading-inspection';

type Props={
 p:Passage;corpus:Corpus;presence?:WordingPresence;annotations:boolean;
 active:Set<string>;unmatched?:Set<number>;range?:WordRange;
 onPreview:(target:ReadingTarget,element:HTMLElement,keyboard?:boolean)=>void;
 onPin:(target:ReadingTarget,element:HTMLElement,keyboard?:boolean)=>void;
 onLeave:()=>void;onDismiss:()=>void;cardKey?:string;
};

export function TextPassage({p,corpus,presence,annotations,active,unmatched,range,onPreview,onPin,onLeave,onDismiss,cardKey}:Props){
 const greek=corpus.edition==='SBLGNT',article=useRef<HTMLElement>(null);
 const [focused,setFocused]=useState<string>();
 useEffect(()=>setFocused(undefined),[p,corpus.edition]);
 const notes=corpus.notes[p.book]||{};let base=0,firstInteractive=true;
 function keyboard(e:React.KeyboardEvent<HTMLElement>,target:ReadingTarget){
  if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onDismiss();return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();onPin(target,e.currentTarget,true);return;}
  const step=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
  if(step||e.key==='Home'||e.key==='End'){
   const items=Array.from(article.current?.querySelectorAll<HTMLElement>('[data-inspectable]')||[]),i=items.indexOf(e.currentTarget);
   const next=items[e.key==='Home'?0:e.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,i+step))];
   if(next){e.preventDefault();next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
  }
 }
 function interaction(target:ReadingTarget){
  const key=wordKey(target),tabIndex=focused?focused===key?0:-1:firstInteractive?0:-1;
  firstInteractive=false;
  return {
   'data-inspectable':true,'data-word-key':key,tabIndex,
   'aria-haspopup':'dialog' as const,'aria-expanded':cardKey===`${corpus.edition}/${key}`,
   onFocus:(e:React.FocusEvent<HTMLElement>)=>{setFocused(key);if(e.currentTarget.matches(':focus-visible'))onPreview(target,e.currentTarget,true)},
   onBlur:onLeave,
   onPointerEnter:(e:React.PointerEvent<HTMLElement>)=>{if(e.pointerType!=='touch')onPreview(target,e.currentTarget)},
   onPointerLeave:onLeave,
   onClick:(e:React.MouseEvent<HTMLElement>)=>{if(window.getSelection()?.toString())return;onPin(target,e.currentTarget)},
   onKeyDown:(e:React.KeyboardEvent<HTMLElement>)=>keyboard(e,target),
  };
 }
 return <article ref={article} className="text-passage" data-book={p.book} data-edition={corpus.edition} style={{'--book-color':COLORS[p.book]} as React.CSSProperties}>
  <div className="passage-heading" tabIndex={-1}><div><span className="book-dot" style={{background:COLORS[p.book]}}/><strong>{NAMES[p.book]}</strong><span className="edition-label">{corpus.edition}</span></div><span>{refLabel(p).replace(NAMES[p.book]+' ','')}</span></div>
  <div className={'scripture '+(greek?'greek ':'')+(annotations?'has-wording':'')} lang={greek?'grc':'en'}>{p.refs.map(ref=>{
   const verse=corpus.books[p.book]?.[ref];
   if(!verse)return <p className="verse-absent" key={ref}><sup>{ref}</sup> No verse text at this reference in this source edition.</p>;
   const words=tokens(verse),start=base;base+=words.length;let position=0;
   const nodes:React.ReactNode[]=[];
   for(let i=0;i<words.length;i++){
    const t=words[i];if(t.start<position)continue;
    nodes.push(verse.slice(position,t.start));
    const run=presence?.verses[ref]?.find(r=>r.start<=t.start&&r.end>=t.end&&r.books.length);
    const target:ReadingTarget={edition:corpus.edition,book:p.book,ref,word:i,run};
    const key=wordKey(target),highlighted=active.has(key)||(range&&start+i>=range.start&&start+i<range.end);
    if(!greek&&annotations&&run&&run.start===t.start){
     const contained=words.flatMap((w,n)=>w.start>=run.start&&w.end<=run.end?[n]:[]);
     nodes.push(<span key={i} role="button" {...interaction(target)} className="wording-phrase inspect-phrase" style={{...wordingLineStyle(run.books),paddingBottom:2+run.books.length*5}} aria-label={verse.slice(run.start,run.end)+' · inspect parallel wording'}>
      {contained.map((n,k)=>{const word=words[n],wordActive=active.has(wordKey({...target,word:n}))||(range&&start+n>=range.start&&start+n<range.end);return <span key={n}><span data-word-key={wordKey({...target,word:n})} data-highlighted={wordActive?'true':undefined} className={'reading-word'+(wordActive?' reading-word-active':'')+(unmatched?.has(start+n)?' reading-word-unmatched':'')}>{verse.slice(word.start,word.end)}</span>{k<contained.length-1?verse.slice(word.end,words[contained[k+1]].start):''}</span>})}
     </span>);position=run.end;continue;
    }
    const className='reading-word'+(highlighted?' reading-word-active':'')+(unmatched?.has(start+i)?' reading-word-unmatched':'');
    if(greek){
     const style=annotations&&run?{...wordingLineStyle(run.books),paddingBottom:2+run.books.length*5}:undefined;
     nodes.push(<button type="button" key={i} {...interaction(target)} className={className+' inspect-word'+(style?' has-parallel':'')} data-highlighted={highlighted?'true':undefined} style={style} aria-label={t.text+' · English meaning and parallels'}><span className="word-ink">{verse.slice(t.start,t.end)}</span></button>);
    }else nodes.push(<span key={i} data-word-key={key} data-highlighted={highlighted?'true':undefined} className={className}>{verse.slice(t.start,t.end)}</span>);
    position=t.end;
   }
   nodes.push(verse.slice(position));
   return <span className="verse" key={ref} data-ref={ref}><sup aria-label={'Verse '+ref}>{ref}</sup>{nodes}{' '}</span>;
  })}</div>
  {annotations&&presence?.groups.length===0&&<p className="text-metadata">No reviewed parallel comparison is mapped for this selection.</p>}
  {!!presence?.limited&&<p className="text-metadata">{presence.limited} long comparison{presence.limited===1?' was':'s were'} beyond the alignment limit and remain uncolored.</p>}
  {p.refs.some(r=>notes[r]?.length)&&<details className="source-notes"><summary>Source notes</summary>{p.refs.flatMap(r=>(notes[r]||[]).map((s,i)=><p key={r+i}><strong>{r}</strong> {s}</p>))}</details>}
 </article>;
}
