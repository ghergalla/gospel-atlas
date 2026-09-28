"use client";
import {useEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
import {Popover,PopoverAnchor,PopoverContent} from '@/components/ui/popover';
import {NAMES,COLORS,tokens,refLabel,alignmentSpans} from '@/lib/gospel';
import type {WordingPresence,WordingRun} from '@/lib/wording-presence';
import type {Group,Passage,Corpus,align,WordRange} from '@/lib/gospel';
import {useGlosses} from '@/lib/greek-glosses';
import {wordingLineStyle} from '@/lib/wording-style';

type Props={p:Passage;corpus:Corpus;diff?:ReturnType<typeof align>;side:number;hover:number|null;onHover:(n:number|null)=>void;mode:string;range?:WordRange;presence?:WordingPresence;onParallel?:(g:Group,books:string[])=>void};
export function TextPassage({p,corpus,diff,side,hover,onHover,mode,range,presence,onParallel}:Props){
 const greek=corpus.edition==='SBLGNT';const {data:glosses,error,retry}=useGlosses(greek);
 const [active,setActive]=useState<{form:string;entry:number;key:string}|null>(null);
 const [phrase,setPhrase]=useState<{text:string;ref:string;run:WordingRun}>();
 const [partners,setPartners]=useState<string[]>([]);const phraseAnchor=useRef<HTMLElement|null>(null);
 const pinned=useRef(false);
 const anchor=useRef<HTMLElement|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const cancel=()=>{if(timer.current)clearTimeout(timer.current)};
 const close=()=>{if(pinned.current)return;cancel();timer.current=setTimeout(()=>setActive(null),180)};
 useEffect(()=>{setActive(null);setPhrase(undefined);pinned.current=false;return cancel},[p,corpus]);
 let tokenOffset=0;const ns=corpus.notes[p.book]||{};
 const pairs=new Map<number,number>();
 if(diff)alignmentSpans(diff).forEach((span,i)=>{const range=side===0?span.a:span.b;if(span.kind==='shared'&&range)for(let word=range.start;word<range.end;word++)pairs.set(word,i)});
 const entry=active&&glosses?.entries[active.entry];
 return <Popover open={!!active} onOpenChange={open=>{if(!open){setActive(null);pinned.current=false}}}><article className="text-passage" style={{'--book-color':COLORS[p.book]} as React.CSSProperties}>
 <div className="passage-heading"><div><span className="book-dot" style={{background:COLORS[p.book]}}/><strong>{NAMES[p.book]}</strong><span className="edition-label">{corpus.edition}</span></div><span>{refLabel(p).replace(NAMES[p.book]+' ','')}</span></div>
 <div className={'scripture '+(greek?'greek ':'')+(presence?'has-wording':'')} lang={greek?'grc':'en'}>{p.refs.map(ref=>{
  const verse=corpus.books[p.book]?.[ref];if(!verse)return <p className="verse-absent" key={ref}><sup>{ref}</sup> No verse text at this reference in this source edition.</p>;
  const local=tokens(verse);const base=tokenOffset;tokenOffset+=local.length;
  const nodes:React.ReactNode[]=[];let pos=0;
  if(!presence&&!greek&&(!diff||diff.limited))nodes.push(verse);
  else local.forEach((t,i)=>{
   if(t.start<pos)return;
   nodes.push(verse.slice(pos,t.start));
   const run=presence?.verses[ref]?.find(r=>r.start===t.start&&r.books.length);
   if(run){
    const form=verse.slice(run.start,run.end);
    const style={...wordingLineStyle(run.books),paddingBottom:2+run.books.length*5};
    nodes.push(<span key={i} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.click()}}} className="wording-phrase" style={style} aria-label={form+' · parallel wording in '+run.books.map(b=>NAMES[b]).join(', ')} onClick={e=>{setActive(null);pinned.current=false;phraseAnchor.current=e.currentTarget;setPhrase({text:form,ref,run});setPartners(run.books)}}>{form}</span>);pos=run.end;return;
   }
   const index=base+i,pair=pairs.get(index),matched=pair!==undefined;
   const cls='word '+(diff&&!diff.limited?(matched?'shared':'unmatched'):'')+((matched&&hover===pair)||(range&&index>=range.start&&index<range.end)?' word-active':'')+(mode==='unique'&&matched?' word-quiet':'');
   const id=glosses?.books[p.book]?.[ref]?.[i],key=ref+':'+i;
   const open=(el:HTMLElement)=>{cancel();anchor.current=el;if(id!==null&&id!==undefined)setActive({form:verse.slice(t.start,t.end),entry:id,key})};
   const word=greek&&id!==null&&id!==undefined?<button type="button" className="greek-word" aria-label={t.text+' · English meaning'} aria-expanded={active?.key===key} onClick={e=>{pinned.current=true;open(e.currentTarget)}} onPointerEnter={e=>{if(e.pointerType!=='touch'&&!pinned.current)open(e.currentTarget)}} onPointerLeave={close} onKeyDown={e=>{if(e.key==='Escape'){setActive(null);e.stopPropagation()}}}>{verse.slice(t.start,t.end)}</button>:verse.slice(t.start,t.end);
   nodes.push(<span key={i} className={cls} onPointerEnter={()=>onHover(pair??null)} onPointerLeave={()=>onHover(null)}>{word}</span>);pos=t.end;
  });
  if(presence||greek||(diff&&!diff.limited))nodes.push(verse.slice(pos));
  return <span className="verse" key={ref} data-ref={ref}><sup aria-label={'Verse '+ref}>{ref}</sup>{nodes}{' '}</span>;
 })}</div>
 {presence&&presence.groups.length===0&&<p className="text-metadata">No reviewed parallel comparison is mapped for this selection.</p>}
 {presence&&presence.limited>0&&<p className="text-metadata">{presence.limited} long comparison{presence.limited===1?' was':'s were'} beyond the alignment limit and remain uncolored.</p>}
 <Popover open={!!phrase} onOpenChange={open=>{if(!open)setPhrase(undefined)}}>
 <PopoverAnchor virtualRef={{current:{getBoundingClientRect:()=>phraseAnchor.current?.getBoundingClientRect()||new DOMRect()}}}/>
 {phrase&&presence&&<PopoverContent className="wording-popover" collisionPadding={16} side="top" onCloseAutoFocus={e=>{e.preventDefault();phraseAnchor.current?.focus()}} onEscapeKeyDown={e=>e.stopPropagation()}>
 <div className="gloss-top"><strong>Read the parallel wording</strong><button className="icon-button" aria-label="Close parallel wording" onClick={()=>setPhrase(undefined)}><X size={16}/></button></div>
 <p className="wording-quotation" lang={greek?'grc':'en'}>{phrase.text}</p>
 <fieldset><legend>Gospels to read together</legend><span className="wording-origin"><i aria-hidden="true" style={wordingLineStyle([p.book])}/>{NAMES[p.book]} · selected text</span>{phrase.run.books.map(b=><label key={b}><input type="checkbox" checked={partners.includes(b)} onChange={e=>setPartners(bs=>e.target.checked?[...bs,b]:bs.filter(v=>v!==b))}/><i aria-hidden="true" style={wordingLineStyle([b])}/>{NAMES[b]}</label>)}</fieldset>
 {presence.groups.filter(g=>phrase.run.matches.some(m=>m.groupId===g.id)).map(g=>{const selected=phrase.run.books.filter(b=>partners.includes(b)&&phrase.run.matches.some(m=>m.book===b&&m.groupId===g.id));return <section key={g.id} className="wording-destination"><small>{g.sourceLabel||`Robertson §${g.section}`}{g.kind==='disputed'?' · differing interpretations':''}</small><p>{g.passages.filter(v=>v.book===p.book||selected.includes(v.book)).map(refLabel).join(' · ')}</p><button className="secondary-button" disabled={!selected.length} onClick={()=>{setPhrase(undefined);onParallel?.(g,[p.book,...selected])}}>Read {selected.length+1} Gospels together</button></section>})}
 <p className="text-metadata">Wording is aligned within this attributed comparison; it does not settle whether accounts describe the same occasion.</p>
 {greek&&glosses&&<div className="phrase-meanings"><strong>English dictionary meanings</strong>{tokens(corpus.books[p.book][phrase.ref]).flatMap((t,i)=>{if(t.start<phrase.run.start||t.end>phrase.run.end)return [];const id=glosses.books[p.book]?.[phrase.ref]?.[i];return <p key={i}><span lang="grc">{t.text}</span> — {id===null||id===undefined?'No verified gloss':glosses.entries[id][1]}</p>})}<small>STEP Bible · CC BY 4.0. Individual glosses, not a phrase translation.</small></div>}
 </PopoverContent>}
 </Popover>
 {p.refs.some(r=>ns[r]?.length>0)&&<details className="source-notes"><summary>Source notes</summary>{p.refs.flatMap(r=>(ns[r]||[]).map((s,i)=><p key={r+i}><strong>{r}</strong> {s}</p>))}</details>}
 {greek&&<p className="text-metadata">{error?<>Word meanings could not load. <button className="text-button" onClick={retry}>Retry meanings</button></>:glosses?'Hover or tap an underlined word for its English dictionary meaning. Words without a verified match remain plain.':'Loading word meanings…'} Greek editorial marks are retained.</p>}
 <PopoverAnchor virtualRef={{current:{getBoundingClientRect:()=>anchor.current?.getBoundingClientRect()||new DOMRect()}}}/>
 {entry&&active&&<PopoverContent className="gloss-popover" side="top" collisionPadding={16} onOpenAutoFocus={e=>e.preventDefault()} onCloseAutoFocus={e=>e.preventDefault()} onEscapeKeyDown={e=>{e.stopPropagation();setActive(null);pinned.current=false;anchor.current?.focus()}} onPointerEnter={cancel} onPointerLeave={close}>
 <div className="gloss-top"><span lang="grc">{active.form}</span><button aria-label="Close word meaning" className="icon-button" onClick={()=>{setActive(null);pinned.current=false;anchor.current?.focus()}}><X size={16}/></button></div><p className="gloss-meaning">{entry[1]}</p><p className="gloss-lemma">Dictionary form <span lang="grc">{entry[0]}</span> · {entry[2]}</p><p>A basic dictionary gloss; the meaning in context may be narrower.</p><a href={glosses!.meta.url} target="_blank" rel="noreferrer">STEP Bible · TAGNT / TBESG · CC BY 4.0 ↗</a>
 </PopoverContent>}
 </article></Popover>;
}
