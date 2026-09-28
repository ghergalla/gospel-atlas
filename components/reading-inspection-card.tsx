"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ArrowUpRight,Check,ChevronDown,ChevronUp,Pin,X} from 'lucide-react';
import {Popover,PopoverAnchor,PopoverContent} from '@/components/ui/popover';
import {NAMES,tokens,refLabel} from '@/lib/gospel';
import type {Corpus,Group} from '@/lib/gospel';
import type {Glosses} from '@/lib/greek-glosses';
import type {WordingPresence} from '@/lib/wording-presence';
import {directTargets,parallelGroups,partnerBooks,wordKey} from '@/lib/reading-inspection';
import type {ReadingTarget} from '@/lib/reading-inspection';
import {wordingLineStyle} from '@/lib/wording-style';

type Props={
 target:ReadingTarget;corpus:Corpus;presence?:WordingPresence;currentGroup:Group;books:string[];
 glosses?:Glosses;glossError:boolean;onRetryGlosses:()=>void;pinned:boolean;keyboard:boolean;
 anchor:React.RefObject<HTMLElement|null>;reader:React.RefObject<HTMLDivElement|null>;
 onClose:(restore?:boolean)=>void;onKeepOpen:()=>void;onLeave:()=>void;onHold:()=>void;
 onParallel:(group:Group,books:string[])=>void;onEvidence:(group:Group)=>void;onHeight:(height:number)=>void;
};

export function EnglishMeaning({target,corpus,glosses,error,onRetry}:{target:ReadingTarget;corpus:Corpus;glosses?:Glosses;error:boolean;onRetry:()=>void}){
 const id=glosses?.books[target.book]?.[target.ref]?.[target.word];
 const entry=id===undefined||id===null?undefined:glosses?.entries[id];
 return <section className="inspection-meaning" aria-label="English meanings">
  <span className="inspection-label">English meanings</span>
  {entry?<><p className="inspection-definition">{entry[1]}</p><p className="inspection-lemma">Dictionary form <span lang="grc">{entry[0]}</span></p>
   <details className="inspection-dictionary"><summary>Dictionary details & source</summary><p>{entry[2]} · A dictionary gloss; the meaning in context may be narrower.</p><a href={glosses!.meta.url} target="_blank" rel="noreferrer">STEP Bible · TAGNT / TBESG · CC BY 4.0 ↗</a></details>
  </>:error?<p className="inspection-unavailable">Meanings could not load. <button className="text-button" onClick={onRetry}>Retry meanings</button></p>:glosses?<p className="inspection-unavailable">No verified English meaning in the current source.</p>:<p className="inspection-unavailable" role="status">Loading English meanings…</p>}
  {entry&&target.run&&tokens(corpus.books[target.book][target.ref].slice(target.run.start,target.run.end)).length>1&&<details className="inspection-other-words"><summary>Other words in this phrase</summary><div>{tokens(corpus.books[target.book][target.ref]).flatMap((t,i)=>{
   if(t.start<target.run!.start||t.end>target.run!.end||i===target.word)return [];
   const n=glosses?.books[target.book]?.[target.ref]?.[i],e=n===undefined||n===null?undefined:glosses?.entries[n];
   return <p key={i}><span lang="grc">{t.text}</span><span>{e?.[1]||'No verified meaning'}</span></p>;
  })}</div><p className="inspection-fine-print">Individual dictionary meanings, not a phrase translation.</p></details>}
 </section>;
}

export function ReadingInspectionCard({target,corpus,presence,currentGroup,books,glosses,glossError,onRetryGlosses,pinned,keyboard,anchor,reader,onClose,onKeepOpen,onLeave,onHold,onParallel,onEvidence,onHeight}:Props){
 const [sheet,setSheet]=useState(false),[shortLandscape,setShortLandscape]=useState(false),[expanded,setExpanded]=useState(false),[offscreen,setOffscreen]=useState<string[]>([]),[cardHeight,setCardHeight]=useState(0);
 const card=useRef<HTMLDivElement>(null),labelId=useId();
 const groups=parallelGroups(target,presence);
 const initial=groups.find(g=>target.run?.matches.some(m=>m.groupId===g.id))||groups[0];
 const [groupId,setGroupId]=useState(initial?.id);
 const group=groups.find(g=>g.id===groupId)||initial;
 const available=group?partnerBooks(group,target):[];
 const [partners,setPartners]=useState(()=>available.filter(b=>!target.run?.books.length||target.run.books.includes(b)));
 const selected=partners.filter(b=>available.includes(b));
 const inCurrent=group?.id===currentGroup.id,hidden=selected.filter(b=>!books.includes(b));
 const greek=corpus.edition==='SBLGNT',verse=corpus.books[target.book]?.[target.ref]||'',word=tokens(verse)[target.word];
 const phrase=target.run?verse.slice(target.run.start,target.run.end):word?.text||'';

 useEffect(()=>{
  const query=window.matchMedia('(max-width:600px) and (orientation:portrait)'),landscape=window.matchMedia('(orientation:landscape) and (max-height:540px)');
  const update=()=>{setSheet(query.matches);setShortLandscape(landscape.matches)};update();query.addEventListener('change',update);landscape.addEventListener('change',update);
  return()=>{query.removeEventListener('change',update);landscape.removeEventListener('change',update)};
 },[]);
 useEffect(()=>{
  if(!sheet||!card.current){onHeight(0);return;}
  const measure=()=>{const height=card.current?.getBoundingClientRect().height||0;onHeight(height);setCardHeight(height)};
  const observer=new ResizeObserver(measure);observer.observe(card.current);measure();
  return()=>{observer.disconnect();onHeight(0)};
 },[sheet,onHeight]);
 useEffect(()=>{if(pinned&&keyboard)card.current?.querySelector<HTMLElement>('[data-inspection-close]')?.focus({preventScroll:true})},[pinned,keyboard,sheet]);
 // Opening a phone card is deliberate. Keep the tapped word above the sheet;
 // ordinary hover previews never scroll the text or its horizontal columns.
 useEffect(()=>{
  if(!sheet||!pinned)return;
  let frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{
   const source=anchor.current;if(!source||!card.current)return;
   const top=card.current.getBoundingClientRect().top-16;
   let delta=source.getBoundingClientRect().bottom-top;
   if(delta<=0)return;
   for(let parent=source.parentElement;parent&&parent!==document.body&&delta>0;parent=parent.parentElement){
    if(/auto|scroll/.test(getComputedStyle(parent).overflowY)&&parent.scrollHeight>parent.clientHeight){
     parent.scrollBy({top:delta,behavior:'instant'});delta=source.getBoundingClientRect().bottom-top;
    }
   }
   if(delta>0)window.scrollBy({top:delta,behavior:'instant'});
  })});
  return()=>cancelAnimationFrame(frame);
 },[sheet,pinned,target,anchor,glosses,expanded,cardHeight]);
 useEffect(()=>{
  if(!sheet)return;
  const outside=(e:PointerEvent)=>{const el=e.target as Element;if(!card.current?.contains(el)&&!el.closest('[data-inspectable]'))onClose(false)};
  document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
 },[sheet,onClose]);
 function findDestination(book:string){
  const scope=reader.current?.querySelector<HTMLElement>(`article[data-edition="${target.edition}"][data-book="${book}"]`);
  if(!scope||!group)return;
  const first=directTargets(target,group.id,book)[0];
  return (first&&scope.querySelector<HTMLElement>(`.reading-word[data-word-key="${wordKey(first)}"]`))||scope.querySelector<HTMLElement>('.passage-heading')||undefined;
 }
 useEffect(()=>{
  let frame=0;
  const measure=()=>{
   frame=0;const scroll=reader.current?.querySelector('.reading-scroll')?.getBoundingClientRect();
   const bottom=sheet&&card.current?card.current.getBoundingClientRect().top:window.innerHeight;
   const next=selected.filter(book=>{
    const node=findDestination(book),r=node?.getBoundingClientRect();
    return !r||r.top<0||r.bottom>bottom||r.left<Math.max(0,scroll?.left||0)||r.right>Math.min(window.innerWidth,scroll?.right||window.innerWidth);
   });
   setOffscreen(prev=>prev.join(',')===next.join(',')?prev:next);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure)};measure();
  document.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule)};
 },[selected.join(','),group?.id,books.join(','),target,sheet,expanded]);
 function goTo(book:string){
  const node=findDestination(book);if(!node)return;
  onHold();node.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
  if(sheet&&card.current){const r=node.getBoundingClientRect(),top=card.current.getBoundingClientRect().top;if(r.bottom>top-16)window.scrollBy({top:r.bottom-top+24,behavior:'instant'})}
 }
 function openTogether(){
  if(!group||!selected.length)return;
  const included=inCurrent?[...books,...selected.filter(b=>!books.includes(b))]:[target.book,...selected];
  onClose(false);onParallel(group,included);
 }
 const affected=group?.pairs.some(p=>selected.some(b=>[p.a,p.b].includes(b)&&[p.a,p.b].includes(target.book))&&['related','event-disputed'].includes(p.relation));
 const matchedHere=group&&target.run?.matches.some(m=>m.groupId===group.id&&selected.includes(m.book));
 const action=!group||!selected.length?null:!inCurrent?<button className="inspection-primary" onClick={openTogether}>Read {selected.length+1} Gospels together<ArrowUpRight size={16}/></button>:hidden.length?<button className="inspection-primary" onClick={openTogether}>{hidden.length===1?'Add '+NAMES[hidden[0]]:'Add '+hidden.length+' Gospels'}<ArrowUpRight size={16}/></button>:offscreen.length?<button className="inspection-primary" onClick={()=>goTo(offscreen[0])}>Go to {NAMES[offscreen[0]]}{target.run?.matches.some(m=>m.book===offscreen[0])?' match':' passage'}<ArrowUpRight size={16}/></button>:<p className="inspection-shown"><Check size={15}/>Shown alongside</p>;
 const content=<>
  <div className="inspection-header"><div><span className="inspection-reference">{NAMES[target.book]} {target.ref} · {target.edition}</span><h3 id={labelId} lang={greek?'grc':'en'}>{greek?word?.text:phrase}</h3></div><div className="inspection-actions">
   <button type="button" data-inspection-hold className={'inspection-hold '+(pinned?'held':'')} aria-label={pinned?'Release held selection':'Hold this selection'} aria-pressed={pinned} onClick={()=>pinned?onClose(true):onHold()}><Pin size={15}/><span>{pinned?'Held':'Hold'}</span></button>
   {sheet&&<button type="button" className="icon-button" aria-label={expanded?'Collapse word card':'Expand word card'} aria-expanded={expanded} onClick={()=>{onHold();setExpanded(v=>!v)}}>{expanded?<ChevronDown size={18}/>:<ChevronUp size={18}/>}</button>}
   <button type="button" className="icon-button" data-inspection-close aria-label="Close word and passage card" onClick={()=>onClose(true)}><X size={19}/></button>
  </div></div>
  <div className="inspection-body">
   {greek&&<EnglishMeaning target={target} corpus={corpus} glosses={glosses} error={glossError} onRetry={onRetryGlosses}/>}
   <section className="inspection-parallels" aria-label="Parallel passages">
    <span className="inspection-label">Parallel passages</span>
    {group?<>
     {groups.length>1&&<select aria-label="Mapped comparison" value={group.id} onChange={e=>{onHold();const next=groups.find(g=>g.id===e.target.value)!;setGroupId(next.id);setPartners(partnerBooks(next,target))}}>{groups.map(g=><option key={g.id} value={g.id}>{g.sourceLabel||'Robertson §'+g.section} · {g.title}</option>)}</select>}
     <p className="inspection-match-status">{!selected.length?'Choose a Gospel to inspect its parallel.':matchedHere?tokens(phrase).length<2?'Part of a longer supported wording match.':'Supported wording match in this phrase.':'Parallel passage available; no supported wording match here.'}</p>
     <fieldset className="inspection-partners"><legend className="sr-only">Gospels to read alongside {NAMES[target.book]}</legend>{available.map(book=>{
      const p=group.passages.find(p=>p.book===book)!;const refs=directTargets(target,group.id,book).map(p=>p.ref);
      const reference=refLabel(refs.length?{book,refs:[...new Set(refs)]}:p).replace(NAMES[book]+' ','');
      return <label key={book}><input type="checkbox" checked={selected.includes(book)} onChange={e=>{onHold();setPartners(prev=>e.target.checked?[...prev,book]:prev.filter(b=>b!==book))}}/><span className="inspection-partner-name"><i aria-hidden="true" style={wordingLineStyle([book])}/>{NAMES[book]}</span><span className="inspection-partner-ref">{reference}</span></label>;
     })}</fieldset>
     {affected&&<p className="inspection-interpretation">This grouping has an interpretive note. <button className="text-button" onClick={()=>{onClose(false);onEvidence(group)}}>Sources & context</button></p>}
     <a className="inspection-attribution" href={group.sourceUrl} target="_blank" rel="noreferrer">{group.sourceLabel||`Robertson · Harmony (1922), §${group.section}`} ↗</a>
    </>:<p className="inspection-match-status">No mapped parallel for this selection.</p>}
   </section>
  </div>
  {(group||!pinned)&&<div className="inspection-footer">{group?(selected.length?action:<p className="inspection-fine-print">Choose a Gospel above to read alongside.</p>):<span className="inspection-fine-print">Click or tap to hold this card.</span>}</div>}
 </>;
 const shared={
  ref:card,'aria-labelledby':labelId,'data-reading-card':true,'data-held':pinned?'true':'false',
  onPointerEnter:onKeepOpen,onPointerLeave:onLeave,onPointerDown:(e:React.PointerEvent)=>{if(!(e.target as Element).closest('[data-inspection-hold]'))onHold()},
  onKeyDown:(e:React.KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose(true)}},
 };
 if(sheet)return createPortal(<div {...shared} role="dialog" aria-modal="false" className={'reading-inspection-card inspection-sheet '+(expanded?'expanded':'')}>{content}</div>,document.body);
 return <Popover open onOpenChange={open=>{if(!open)onClose(false)}}>
  <PopoverAnchor virtualRef={{current:{getBoundingClientRect:()=>anchor.current?.getBoundingClientRect()||new DOMRect()}}}/>
  <PopoverContent {...shared} className="reading-inspection-card inspection-floating" side={shortLandscape?'right':'bottom'} align={shortLandscape?'center':'start'} sideOffset={8} collisionPadding={12} onOpenAutoFocus={e=>e.preventDefault()} onCloseAutoFocus={e=>e.preventDefault()} onInteractOutside={e=>{if((e.target as Element)?.closest('[data-inspectable]'))e.preventDefault()}} onEscapeKeyDown={e=>{e.preventDefault();e.stopPropagation();onClose(true)}}>{content}</PopoverContent>
 </Popover>;
}
