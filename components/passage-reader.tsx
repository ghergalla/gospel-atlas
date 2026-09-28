"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeftRight,Maximize2,SlidersHorizontal} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {TextLoadState} from '@/components/text-load-state';
import {TextPassage} from '@/components/text-passage';
import {RelatedTeachings} from '@/components/related-teachings';
import {WordingControls} from '@/components/wording-controls';
import {ReadingInspectionCard} from '@/components/reading-inspection-card';
import {Evidence,Subsections} from '@/components/reader-context';
import {useCorpus} from '@/lib/use-corpus';
import {useGlosses} from '@/lib/greek-glosses';
import {useReadingInspection} from '@/lib/use-reading-inspection';
import {highlightedWords,inspectionKey} from '@/lib/reading-inspection';
import {computeWordingPresence} from '@/lib/wording-presence';
import {NAMES,align,passageText,isRelatedTeaching,isExampleStudy} from '@/lib/gospel';
import type {Group,Index,Corpus,LensHighlight} from '@/lib/gospel';
export {Subsections} from '@/components/reader-context';

export type DiffSettings={pair:string;normalized:boolean;emphasis:string};
type Props={group:Group;index:Index;books:string[];corpus?:Corpus;tab:string;setTab:(s:string)=>void;wide?:boolean;onExpand?:()=>void;settings:DiffSettings;setSettings:(s:DiffSettings)=>void;onNavigate:(g:Group)=>void;highlight?:LensHighlight;textError?:string;onRetryText:()=>void;editionForReader:string;parallel:string;setParallel:(s:string)=>void;wording:boolean;setWording:(v:boolean)=>void;onParallel:(g:Group,books:string[])=>void};
const editionName=(id:string)=>id==='SBLGNT'?'Greek · SBLGNT':id;
const emptyMarks=new Set<string>();
function unmatchedWords(d:ReturnType<typeof align>|undefined,side:0|1){
 if(!d||d.limited)return;
 const matched=new Set(d.pairs.map(p=>p[side]));return new Set((side===0?d.x:d.y).flatMap((_,i)=>matched.has(i)?[]:[i]));
}

export function Reader({group,index,books,corpus,tab,setTab,wide,onExpand,settings,setSettings,onNavigate,highlight,textError,onRetryText,editionForReader,parallel,setParallel,wording,setWording,onParallel}:Props){
 const alongside=!!parallel&&parallel!==editionForReader,secondary=useCorpus(alongside?parallel:'');
 const glosses=useGlosses(editionForReader==='SBLGNT'||(alongside&&parallel==='SBLGNT'));
 const {pair,normalized}=settings;
 const [layout,setLayout]=useState('columns'),[overflow,setOverflow]=useState(false),[sheetHeight,setSheetHeight]=useState(0);
 const readerRef=useRef<HTMLDivElement>(null),contentRef=useRef<HTMLDivElement>(null),scrollRef=useRef<HTMLDivElement>(null);
 const lastReadTab=useRef(tab==='differences'?'differences':'text');if(tab!=='evidence')lastReadTab.current=tab;
 const showUnmatched=(tab==='evidence'?lastReadTab.current:tab)==='differences',annotations=wording||showUnmatched;
 const passages=useMemo(()=>group.passages.filter(p=>books.includes(p.book)).sort((a,b)=>books.indexOf(a.book)-books.indexOf(b.book)),[group,books.join(',')]);
 const pairs=group.pairs.filter(p=>books.includes(p.a)&&books.includes(p.b)).map(p=>books.indexOf(p.a)<books.indexOf(p.b)?p:{...p,a:p.b,b:p.a});
 const chosen=pairs.find(p=>p.a+'-'+p.b===pair||p.b+'-'+p.a===pair)||pairs[0];
 const pa=passages.find(p=>p.book===chosen?.a),pb=passages.find(p=>p.book===chosen?.b);
 const diff=useMemo(()=>corpus&&pa&&pb&&showUnmatched?align(passageText(pa,corpus),passageText(pb,corpus),normalized):undefined,[corpus,pa,pb,normalized,showUnmatched]);
 const secondaryDiff=useMemo(()=>secondary.corpus&&pa&&pb&&showUnmatched?align(passageText(pa,secondary.corpus),passageText(pb,secondary.corpus),normalized):undefined,[secondary.corpus,pa,pb,normalized,showUnmatched]);
 const primaryUnmatched=useMemo(()=>[unmatchedWords(diff,0),unmatchedWords(diff,1)],[diff]);
 const companionUnmatched=useMemo(()=>[unmatchedWords(secondaryDiff,0),unmatchedWords(secondaryDiff,1)],[secondaryDiff]);
 const presence=useMemo(()=>corpus&&(annotations||corpus.edition==='SBLGNT')?Object.fromEntries(passages.map(p=>[p.book,computeWordingPresence(index,corpus,p,group,normalized)])):undefined,[annotations,corpus,index,group,passages,normalized]);
 const secondaryPresence=useMemo(()=>secondary.corpus&&(annotations||secondary.corpus.edition==='SBLGNT')?Object.fromEntries(passages.map(p=>[p.book,computeWordingPresence(index,secondary.corpus!,p,group,normalized)])):undefined,[annotations,secondary.corpus,index,group,passages,normalized]);
 const inspection=useReadingInspection([group.id,editionForReader,parallel,books.join(','),normalized,annotations,tab].join('|'));
 const target=inspection.state.target;
 const inspectionCorpus=target?.edition===corpus?.edition?corpus:target?.edition===secondary.corpus?.edition?secondary.corpus:undefined;
 const active=useMemo(()=>highlightedWords(target,inspectionCorpus),[target,inspectionCorpus]);
 const inspectionPresence=target?(target.edition===corpus?.edition?presence:secondaryPresence)?.[target.book]:undefined;
 const cardOpen=inspection.state.phase==='open'||inspection.state.phase==='pinned';
 const activeHighlight=highlight?.key===group.id+corpus?.edition+chosen?.a+chosen?.b+normalized?highlight:undefined;
 const legendBooks=index.books.map(b=>b.id).filter(b=>[presence,secondaryPresence].some(p=>p&&Object.values(p).some(v=>Object.values(v.verses).some(runs=>runs.some(run=>run.books.includes(b))))));
 useEffect(()=>{contentRef.current?.scrollTo({top:0});scrollRef.current?.scrollTo({left:0})},[group.id,editionForReader]);
 useEffect(()=>{
  const el=scrollRef.current;if(!el)return;
  const measure=()=>setOverflow(el.scrollWidth>el.clientWidth+2);
  const observer=new ResizeObserver(measure);observer.observe(el);if(el.firstElementChild)observer.observe(el.firstElementChild);measure();return()=>observer.disconnect();
 },[passages.length,layout,tab,corpus,secondary.corpus]);
 const counts=(d:ReturnType<typeof align>|undefined,ed:string)=>d&&!d.limited&&chosen?<p className="alignment-summary" key={ed}><b>{ed}</b> · {d.pairs.length} matched words · {d.x.length-d.pairs.length} unmatched in {NAMES[chosen.a]} · {d.y.length-d.pairs.length} in {NAMES[chosen.b]}</p>:null;
 const rows=[{edition:editionForReader,corpus,presence,unmatched:primaryUnmatched,error:textError,retry:onRetryText},...(alongside?[{edition:parallel,corpus:secondary.corpus,presence:secondaryPresence,unmatched:companionUnmatched,error:secondary.error,retry:secondary.retry}]:[])];
 return <div ref={readerRef} id="passage-reader" tabIndex={-1} className={'reader unified-reader '+(wide?'reader-wide ':'')+(sheetHeight?'has-inspection-sheet':'')} data-layout={layout} data-highlight={annotations?'parallel':'plain'} style={{'--inspection-height':sheetHeight+'px'} as React.CSSProperties}>
  <div className="reader-top"><div><span className="overline">{group.kind==='reading'?'READ THE TEXT':isRelatedTeaching(group)?'RELATED TEACHING':isExampleStudy(group)?'EXAMPLE STUDY':`PASSAGE ${group.section}`}</span><h2>{group.title}</h2></div>{onExpand&&<button className="icon-button" aria-label="Expand passage comparison" onClick={onExpand}><Maximize2 size={18}/></button>}</div>
  <Tabs value={tab==='evidence'?'evidence':'read'} onValueChange={v=>setTab(v==='evidence'?'evidence':lastReadTab.current)}><TabsList className="reader-tabs" variant="line"><TabsTrigger value="read">Read</TabsTrigger><TabsTrigger value="evidence">Sources & context</TabsTrigger></TabsList></Tabs>
  <div className="reader-content" ref={contentRef}>
   {tab==='evidence'?<Evidence group={group} index={index}/>:<>
    {(group.parentId||group.subsectionIds)&&<Subsections group={group} index={index} onSelect={onNavigate}/>}
    <div className="reading-toolbar" aria-label="Reading display">
     <div className="reading-control"><span>Text markings</span><label className="parallel-toggle"><input type="checkbox" checked={annotations} onChange={e=>{setWording(e.target.checked);if(!e.target.checked)setTab('text')}}/>Parallel wording</label></div>
     <label className="reading-control"><span>Second edition</span><select aria-label="Second Bible edition" value={alongside?parallel:''} onChange={e=>setParallel(e.target.value)}><option value="">None</option>{index.editions.filter(e=>e.id!==editionForReader).map(e=><option key={e.id} value={e.id}>{e.id==='SBLGNT'?'Greek':e.id}</option>)}</select></label>
    </div>
    <div className="reading-key">
     {annotations&&<WordingControls books={legendBooks}/>}
     <details className="reader-options"><summary><SlidersHorizontal size={14}/>Reading options</summary><div className="reader-options-body">
      <label className="reading-control"><span>Layout</span><select aria-label="Passage layout" value={layout} onChange={e=>setLayout(e.target.value)}><option value="columns">Side by side</option><option value="stacked">Single column</option></select></label>
      {annotations&&<label className="reading-check"><input type="checkbox" checked={normalized} onChange={e=>setSettings({...settings,normalized:e.target.checked})}/>Ignore case and Greek accents</label>}
      <p>Hover to preview; click or tap to hold a word or phrase. Escape or Close clears the selection. Keyboard: Tab enters a Gospel’s text, arrow keys move between words or phrases, and Enter holds the card.</p>
      {annotations&&<p>Underlines identify wording in other Gospels. Matching phrases brighten together within the same edition. Matches require at least two consecutive words, including a word beyond common connectors. A match does not establish the same meaning or occasion.</p>}
      {showUnmatched&&<>{counts(diff,editionForReader)}{alongside&&counts(secondaryDiff,parallel)}<p>Amber identifies wording unmatched in the named pair. It does not establish an addition or omission, or rule out a match in another Gospel.</p></>}
      {alongside&&<p>Each edition occupies a complete row of Gospel columns in the same order. Each edition’s wording is compared independently.</p>}
     </div></details>
    </div>
    {annotations&&chosen&&<div className="unmatched-tools"><label className="unmatched-toggle"><input type="checkbox" checked={showUnmatched} onChange={e=>setTab(e.target.checked?'differences':'text')}/><i aria-hidden="true"/>Emphasize unmatched wording</label>{showUnmatched&&(pairs.length>1?<select aria-label="Unmatched wording pair" value={chosen.a+'-'+chosen.b} onChange={e=>setSettings({...settings,pair:e.target.value})}>{pairs.map(p=><option key={p.a+p.b} value={p.a+'-'+p.b}>{NAMES[p.a]} ↔ {NAMES[p.b]}</option>)}</select>:<span className="unmatched-scope">{NAMES[chosen.a]} ↔ {NAMES[chosen.b]}</span>)}</div>}
    <p className="reading-caption"><span className="pointer-reading-hint">{editionForReader==='SBLGNT'||parallel==='SBLGNT'?'Hover any Greek word for meanings and parallels. Click to hold.':annotations?'Hover a marked phrase to follow its parallels. Click to hold.':'Turn on Parallel wording to explore shared phrases.'}</span><span className="touch-reading-hint">{editionForReader==='SBLGNT'||parallel==='SBLGNT'?'Tap any Greek word for meanings and parallels.':annotations?'Tap a marked phrase to explore its parallels.':'Turn on Parallel wording to explore shared phrases.'}</span></p>
    {(diff?.limited||secondaryDiff?.limited)&&<p className="notice">A selection is too long for interactive alignment. Choose a smaller source subsection.</p>}
    {overflow&&<p className="reading-scroll-hint"><ArrowLeftRight size={15}/>Scroll across for all {passages.length} Gospels. Landscape gives more room.</p>}
    {!corpus?<TextLoadState edition={editionForReader} error={textError} onRetry={onRetryText}/>:!passages.length?<p className="notice">Add this passage’s Gospel using the controls above.</p>:<div className="reading-scroll" ref={scrollRef} tabIndex={overflow?0:undefined} role={overflow?'region':undefined} aria-label={overflow?'Gospel columns, scroll horizontally':undefined}>
     <div className={'edition-rows '+(alongside?'has-companion':'')} data-count={passages.length} style={{'--passage-count':passages.length} as React.CSSProperties}>
      {rows.map((row,i)=><section key={row.edition} className="edition-row" aria-label={row.edition+' passages'}>
       {alongside&&<div className="edition-row-heading"><h3>{editionName(row.edition)}</h3><span>{i?'Second edition':'Primary edition'}</span></div>}
       {row.corpus?<div className="text-grid">{passages.map(p=><TextPassage key={p.book} p={p} corpus={row.corpus!} presence={row.presence?.[p.book]} annotations={annotations} active={target?.edition===row.edition?active:emptyMarks} unmatched={showUnmatched?p.book===chosen?.a?row.unmatched[0]:p.book===chosen?.b?row.unmatched[1]:undefined:undefined} range={i===0?p.book===chosen?.a?activeHighlight?.a:p.book===chosen?.b?activeHighlight?.b:undefined:undefined} onPreview={inspection.preview} onPin={inspection.pin} onLeave={inspection.leave} onDismiss={()=>inspection.close(true)} cardKey={cardOpen&&target?inspectionKey(target):undefined}/>)}</div>:<TextLoadState edition={row.edition} error={row.error} onRetry={row.retry}/>}
      </section>)}
     </div>
    </div>}
    <RelatedTeachings group={group} index={index} books={books} onOpen={onParallel} onNavigate={onNavigate} onEvidence={()=>setTab('evidence')}/>
   </>}
  </div>
  {cardOpen&&target&&inspectionCorpus&&<ReadingInspectionCard key={inspectionKey(target)} target={target} corpus={inspectionCorpus} presence={inspectionPresence} currentGroup={group} books={books} glosses={glosses.data} glossError={glosses.error} onRetryGlosses={glosses.retry} pinned={inspection.state.phase==='pinned'} keyboard={inspection.keyboard} anchor={inspection.anchor} reader={readerRef} onClose={inspection.close} onKeepOpen={inspection.keepOpen} onLeave={inspection.leave} onHold={inspection.hold} onParallel={onParallel} onEvidence={g=>{onNavigate(g);setTab('evidence')}} onHeight={setSheetHeight}/>}
 </div>;
}
