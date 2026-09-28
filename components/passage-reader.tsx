"use client";

import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeftRight,ArrowUpRight,Maximize2,SlidersHorizontal} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {TextLoadState} from '@/components/text-load-state';
import {TextPassage} from '@/components/text-passage';
import {RelatedTeachings} from '@/components/related-teachings';
import {WordingControls} from '@/components/wording-controls';
import {useCorpus} from '@/lib/use-corpus';
import {computeWordingPresence} from '@/lib/wording-presence';
import {NAMES,align,passageText,isRelatedTeaching,isExampleStudy} from '@/lib/gospel';
import type {Group,Index,Corpus,LensHighlight} from '@/lib/gospel';

export type DiffSettings={pair:string;normalized:boolean;emphasis:string};
type Props={group:Group;index:Index;books:string[];corpus?:Corpus;tab:string;setTab:(s:string)=>void;wide?:boolean;onExpand?:()=>void;settings:DiffSettings;setSettings:(s:DiffSettings)=>void;onNavigate:(g:Group)=>void;highlight?:LensHighlight;textError?:string;onRetryText:()=>void;editionForReader:string;parallel:string;setParallel:(s:string)=>void;wording:boolean;setWording:(v:boolean)=>void;onParallel:(g:Group,books:string[])=>void};
const editionName=(id:string)=>id==='SBLGNT'?'Greek · SBLGNT':id;

export function Reader({group,index,books,corpus,tab,setTab,wide,onExpand,settings,setSettings,onNavigate,highlight,textError,onRetryText,editionForReader,parallel,setParallel,wording,setWording,onParallel}:Props){
 const alongside=!!parallel&&parallel!==editionForReader;
 const secondary=useCorpus(alongside?parallel:'');
 const {pair,normalized,emphasis}=settings;
 const [hover,setHover]=useState<{edition:string;span:number|null}>();
 const [layout,setLayout]=useState('columns');
 const [overflow,setOverflow]=useState(false);
 const contentRef=useRef<HTMLDivElement>(null),scrollRef=useRef<HTMLDivElement>(null);
 const lastReadTab=useRef(tab==='differences'?'differences':'text');
 if(tab!=='evidence')lastReadTab.current=tab;
 const style=tab==='differences'?'differences':wording?'shared':'plain';
 const passages=group.passages.filter(p=>books.includes(p.book)).sort((a,b)=>books.indexOf(a.book)-books.indexOf(b.book));
 const pairs=group.pairs.filter(p=>books.includes(p.a)&&books.includes(p.b)).map(p=>books.indexOf(p.a)<books.indexOf(p.b)?p:{...p,a:p.b,b:p.a});
 const chosen=pairs.find(p=>p.a+'-'+p.b===pair||p.b+'-'+p.a===pair)||pairs[0];
 const pa=passages.find(p=>p.book===chosen?.a),pb=passages.find(p=>p.book===chosen?.b);
 const displayed=style==='differences'&&pa&&pb?[pa,pb]:passages;
 const diff=useMemo(()=>corpus&&pa&&pb&&tab==='differences'?align(passageText(pa,corpus),passageText(pb,corpus),normalized):undefined,[corpus,pa,pb,normalized,tab]);
 const secondaryDiff=useMemo(()=>secondary.corpus&&pa&&pb&&tab==='differences'?align(passageText(pa,secondary.corpus),passageText(pb,secondary.corpus),normalized):undefined,[secondary.corpus,pa,pb,normalized,tab]);
 const presence=useMemo(()=>wording&&tab==='text'&&corpus?Object.fromEntries(passages.map(p=>[p.book,computeWordingPresence(index,corpus,p,group,normalized)])):undefined,[wording,tab,corpus,index,group,books.join(','),normalized]);
 const secondaryPresence=useMemo(()=>wording&&tab==='text'&&secondary.corpus?Object.fromEntries(passages.map(p=>[p.book,computeWordingPresence(index,secondary.corpus!,p,group,normalized)])):undefined,[wording,tab,secondary.corpus,index,group,books.join(','),normalized]);
 const activeHighlight=highlight?.key===group.id+corpus?.edition+chosen?.a+chosen?.b+normalized?highlight:undefined;
 const legendBooks=index.books.map(b=>b.id).filter(b=>[presence,secondaryPresence].some(p=>p&&Object.values(p).some(v=>Object.values(v.verses).some(runs=>runs.some(run=>run.books.includes(b))))));
 useEffect(()=>{contentRef.current?.scrollTo({top:0});scrollRef.current?.scrollTo({left:0});setHover(undefined)},[group.id,style,editionForReader,settings.pair]);
 useEffect(()=>{
  const el=scrollRef.current;if(!el)return;
  const measure=()=>setOverflow(el.scrollWidth>el.clientWidth+2);
  const observer=new ResizeObserver(measure);observer.observe(el);if(el.firstElementChild)observer.observe(el.firstElementChild);
  measure();return()=>observer.disconnect();
 },[displayed.length,layout,tab,corpus,secondary.corpus]);
 const setStyle=(value:string)=>{setTab(value==='differences'?'differences':'text');if(value!=='differences')setWording(value==='shared')};
 const counts=(d:ReturnType<typeof align>|undefined,ed:string)=>d&&!d.limited&&chosen?<p className="alignment-summary" key={ed}><b>{ed}</b> · {d.pairs.length} matched words · {d.x.length-d.pairs.length} unmatched in {NAMES[chosen.a]} · {d.y.length-d.pairs.length} in {NAMES[chosen.b]}</p>:null;
 return <div id="passage-reader" tabIndex={-1} className={'reader unified-reader '+(wide?'reader-wide':'')} data-layout={layout} data-highlight={style}>
  <div className="reader-top"><div><span className="overline">{group.kind==='reading'?'READ THE TEXT':isRelatedTeaching(group)?'RELATED TEACHING':isExampleStudy(group)?'EXAMPLE STUDY':`PASSAGE ${group.section}`}</span><h2>{group.title}</h2></div>{onExpand&&<button className="icon-button" aria-label="Expand passage comparison" onClick={onExpand}><Maximize2 size={18}/></button>}</div>
  <Tabs value={tab==='evidence'?'evidence':'read'} onValueChange={v=>setTab(v==='evidence'?'evidence':lastReadTab.current)}><TabsList className="reader-tabs" variant="line"><TabsTrigger value="read">Read</TabsTrigger><TabsTrigger value="evidence">Sources & context</TabsTrigger></TabsList></Tabs>
  <div className="reader-content" ref={contentRef}>
   {tab==='evidence'?<Evidence group={group} index={index}/>:<>
    {(group.parentId||group.subsectionIds)&&<Subsections group={group} index={index} onSelect={onNavigate}/>}
    <div className="reading-toolbar" aria-label="Reading display">
     <label className="reading-control"><span>Highlight</span><select aria-label="Reading highlights" value={style} onChange={e=>setStyle(e.target.value)}><option value="shared">Shared wording</option><option value="differences" disabled={!chosen}>Differences</option><option value="plain">Plain text</option></select></label>
     <label className="reading-control"><span>Second edition</span><select aria-label="Second Bible edition" value={alongside?parallel:''} onChange={e=>setParallel(e.target.value)}><option value="">None</option>{index.editions.filter(e=>e.id!==editionForReader).map(e=><option key={e.id} value={e.id}>{e.id==='SBLGNT'?'Greek':e.id}</option>)}</select></label>
    </div>
    {style==='differences'&&pairs.length>1&&<label className="reading-control pair-control"><span>Compare two Gospels</span><select aria-label="Passage pair" value={chosen.a+'-'+chosen.b} onChange={e=>setSettings({...settings,pair:e.target.value})}>{pairs.map(p=><option key={p.a+p.b} value={p.a+'-'+p.b}>{NAMES[p.a]} ↔ {NAMES[p.b]}</option>)}</select></label>}
    <div className="reading-key">
     {style==='shared'&&<WordingControls books={legendBooks}/>}
     {style==='differences'&&<div className="diff-legend"><span><i className="shared-swatch"/>Matching phrases</span><span><i className="unique-swatch"/>Unmatched here</span></div>}
     <details className="reader-options"><summary><SlidersHorizontal size={14}/>Reading options</summary><div className="reader-options-body">
      <label className="reading-control"><span>Layout</span><select aria-label="Passage layout" value={layout} onChange={e=>setLayout(e.target.value)}><option value="columns">Side by side</option><option value="stacked">Single column</option></select></label>
      {style!=='plain'&&<label className="reading-check"><input type="checkbox" checked={normalized} onChange={e=>setSettings({...settings,normalized:e.target.checked})}/>Ignore case and Greek accents</label>}
      {style==='differences'&&<label className="reading-check"><input type="checkbox" checked={emphasis==='unique'} onChange={e=>setSettings({...settings,emphasis:e.target.checked?'unique':'all'})}/>Soften matching wording</label>}
      {style!=='plain'&&<p>Matches require at least two consecutive words, including a word beyond common connectors. Isolated words and connector-only fragments stay unlinked. This compares wording; it does not establish the same meaning or occasion.</p>}
      {style==='shared'&&<p>Lines identify the other Gospel or Gospels. Tap a marked phrase to inspect its comparison. In a selected passage group, only that group is compared; direct chapter reading searches the attributed mappings.</p>}
      {style==='differences'&&<>{counts(diff,editionForReader)}{alongside&&counts(secondaryDiff,parallel)}<p>Amber means unmatched in this pair, not necessarily an added detail or an omission. Punctuation and the original Scripture text are retained.</p></>}
      {alongside&&<p>Each edition occupies a complete row of Gospel columns, in the same order. Wording is compared within each edition.</p>}
     </div></details>
    </div>
    {style==='shared'&&legendBooks.length>0&&<p className="reading-caption">Tap an underlined phrase to explore its parallels.</p>}
    {style==='differences'&&!chosen&&<p className="notice">Choose a passage with two visible Gospels to compare wording.</p>}
    {diff?.limited&&<p className="notice">This selection is too long for interactive word alignment. Choose a smaller source subsection.</p>}
    {overflow&&<p className="reading-scroll-hint"><ArrowLeftRight size={15}/>Scroll across for all {displayed.length} Gospels. Landscape gives more room.</p>}
    {!corpus?<TextLoadState edition={editionForReader} error={textError} onRetry={onRetryText}/>:!displayed.length?<p className="notice">Add this passage’s Gospel using the controls above.</p>:<div className="reading-scroll" ref={scrollRef} tabIndex={overflow?0:undefined} role={overflow?'region':undefined} aria-label={overflow?'Gospel columns, scroll horizontally':undefined}>
     <div className={'edition-rows '+(alongside?'has-companion':'')} data-count={displayed.length} style={{'--passage-count':displayed.length} as React.CSSProperties}>
      <section className="edition-row" aria-label={editionForReader+' passages'}>
       {alongside&&<div className="edition-row-heading"><h3>{editionName(editionForReader)}</h3><span>Primary edition</span></div>}
       <div className="text-grid">{displayed.map((p,i)=><TextPassage key={p.book} p={p} corpus={corpus} diff={diff} side={i} hover={hover?.edition===editionForReader?hover.span:null} onHover={span=>setHover({edition:editionForReader,span})} mode={emphasis} range={i===0?activeHighlight?.a:activeHighlight?.b} presence={presence?.[p.book]} onParallel={onParallel}/>)}</div>
      </section>
      {alongside&&<section className="edition-row" aria-label={parallel+' passages'}>
       <div className="edition-row-heading"><h3>{editionName(parallel)}</h3><span>Second edition</span></div>
       {secondary.corpus?<div className="text-grid">{displayed.map((p,i)=><TextPassage key={p.book} p={p} corpus={secondary.corpus!} diff={secondaryDiff} side={i} hover={hover?.edition===parallel?hover.span:null} onHover={span=>setHover({edition:parallel,span})} mode={emphasis} presence={secondaryPresence?.[p.book]} onParallel={onParallel}/>)}</div>:<TextLoadState edition={parallel} error={secondary.error} onRetry={secondary.retry}/>}
      </section>}
     </div>
    </div>}
    <RelatedTeachings group={group} index={index} books={books} onOpen={onParallel} onNavigate={onNavigate} onEvidence={()=>setTab('evidence')}/>
   </>}
  </div>
 </div>;
}

export function Subsections({group,index,onSelect}:{group:Group;index:Index;onSelect:(g:Group)=>void}){const parent=index.groups.find(g=>g.id===(group.parentId||group.id));const children=index.groups.filter(g=>g.parentId===parent?.id);if(!parent||!children.length)return null;return <div className="subsection-nav"><span className="overline">WITHIN §{parent.section}</span><select aria-label="Source subsection" value={group.id} onChange={e=>onSelect(index.groups.find(g=>g.id===e.target.value)!)}><option value={parent.id}>Whole section · {parent.title}</option>{children.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select>{group.parentId&&<button className="text-button" onClick={()=>onSelect(parent)}>Whole section</button>}</div>}

function Evidence({group,index}:{group:Group;index:Index}){return <div className="evidence"><span className="overline">RELATIONSHIP EVIDENCE</span><h3>{(group.kind==='focused'||group.kind==='editorial-unit')?'An editorial close comparison':isRelatedTeaching(group)?'A shared teaching across settings':group.kind==='related'?'Related accounts':group.kind==='disputed'?'An identification with differing interpretations':group.kind==='reading'?'Direct reading':'A source-attributed grouping'}</h3><p>{group.status}.</p>{group.sourceUrl&&<><a href={group.sourceUrl} target="_blank" rel="noreferrer" className="source-link">{group.sourceLabel||`A. T. Robertson · Harmony (1922), §${group.section}`}<ArrowUpRight size={15}/></a><p className="source-reference">{group.sourceRefs}</p></>}{group.kind!=='reading'&&<p>A grouping supports comparison. It does not by itself establish word-for-word equivalence or settle every question about event identity.</p>}{group.notes.map((n,i)=><section className="interpretation-note" key={i}><h4>{n.label}</h4><p>{n.text}</p><a target="_blank" rel="noreferrer" href={n.url}>{n.source}<ArrowUpRight size={14}/></a></section>)}<details><summary>About this mapping</summary><p>The main overview transcribes {index.sourceSections} Gospel-bearing sections from Robertson’s analytical outline. Its headings and groupings are interpretive. All {index.referenceAudit.checked} main reference sets were compared with the source’s separate passage register: {index.referenceAudit.agree} agree, with one documented boundary difference in §54. This checks transcription, not event identity. The {index.sourceSubsections} detailed source units are transcribed from explicit outline rows. Another {index.editorialUnits} close reading selections use editorial boundaries within those source groups. Interpretive review continues.</p><p>Traditional, creedal Christian study guides the project. Attributed interpretations remain distinct from the biblical text and calculated comparisons.</p></details></div>}
