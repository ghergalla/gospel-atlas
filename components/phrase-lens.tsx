"use client";

import {TextLoadState} from '@/components/text-load-state';
import {useMemo,useState,useEffect} from 'react';
import {NAMES,COLORS,Group,Corpus,align,alignmentSpans,sourceExcerpt,passageText,refLabel,AlignmentSpan,LensHighlight} from '@/lib/gospel';

export function PhraseLens({group,books,corpus,pair,normalized,words,onPair,onNormalize,onHighlight,edition,textError,onRetryText}:{group:Group;books:string[];corpus?:Corpus;pair:string;normalized:boolean;words:boolean;onPair:(p:string)=>void;onNormalize:(n:boolean)=>void;onHighlight:(h:LensHighlight)=>void;edition:string;textError?:string;onRetryText:()=>void}){
 const pairs=group.pairs.filter(p=>books.includes(p.a)&&books.includes(p.b)).map(p=>books.indexOf(p.a)<books.indexOf(p.b)?p:{...p,a:p.b,b:p.a});
 const chosen=pairs.find(p=>p.a+'-'+p.b===pair||p.b+'-'+p.a===pair)||pairs[0];
 const passages=chosen?[chosen.a,chosen.b].map(b=>group.passages.find(p=>p.book===b)!):[];
 const texts=corpus?passages.map(p=>passageText(p,corpus)):[];
 const diff=useMemo(()=>texts.length===2?align(texts[0],texts[1],normalized):undefined,[texts[0],texts[1],normalized]);
 const spans=useMemo(()=>diff?alignmentSpans(diff):[],[diff]);
 const key=group.id+corpus?.edition+chosen?.a+chosen?.b+normalized;
 const [selection,setSelection]=useState<{key:string;id:string}>();
 const [hover,setHover]=useState<{key:string;id:string}>();
 const pick=(id:string)=>{setHover(undefined);setSelection({key,id})};
 const selected=spans.find(s=>s.id===(hover?.key===key?hover.id:selection?.key===key?selection.id:undefined));
 const active=selected||spans.filter(s=>s.kind==='shared').sort((a,b)=>(b.a!.end-b.a!.start)-(a.a!.end-a.a!.start))[0]||spans[0];
 useEffect(()=>{onHighlight({key,a:active?.a,b:active?.b})},[key,active,onHighlight]);
 const excerpt=(s:AlignmentSpan,side:number)=>{const range=side===0?s.a:s.b;return range&&diff?sourceExcerpt(texts[side],side===0?diff.x:diff.y,range):'';};
 const max=Math.max(diff?.x.length||1,diff?.y.length||1);const height=400,top=46,unit=height/max;
 const y=(n:number)=>top+n*unit;
 const interactive=(s:AlignmentSpan)=>({tabIndex:0,role:'button',onPointerEnter:()=>setHover({key,id:s.id}),onPointerLeave:()=>setHover(undefined),onFocus:()=>setHover({key,id:s.id}),onBlur:()=>setHover(undefined),onClick:()=>pick(s.id),onKeyDown:(e:React.KeyboardEvent<SVGGElement>)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(s.id);}},'aria-label':s.kind==='shared'?'Aligned wording: '+excerpt(s,0):'Unmatched in '+NAMES[passages[s.a?0:1].book]+': '+excerpt(s,s.a?0:1)});
 return <section className="phrase-lens" aria-label="Passage wording map">
  <div className="lens-toolbar"><div><span className="overline">{words?'WORD DETAIL':'PHRASE DETAIL'}</span><h3>{group.title}</h3></div>{pairs.length>0&&<select aria-label="Detail passage pair" value={chosen.a+'-'+chosen.b} onChange={e=>onPair(e.target.value)}>{pairs.map(p=><option key={p.a+p.b} value={p.a+'-'+p.b}>{NAMES[p.a]} ↔ {NAMES[p.b]}</option>)}</select>}</div>
  {!corpus?<TextLoadState edition={edition} error={textError} onRetry={onRetryText}/>:!chosen?<p className="lens-empty">This selection has one visible account. Choose another passage or add a Gospel to compare wording.</p>:diff?.limited?<p className="lens-empty">This passage is too long for interactive alignment. Choose one of its smaller sections above.</p>:diff&&<>
   <div className="lens-summary"><span><b>{diff.pairs.length}</b> aligned</span>{passages.map((p,i)=><span key={p.book}><i style={{background:COLORS[p.book]}}/>{NAMES[p.book]} <b>{(i===0?diff.x:diff.y).length-diff.pairs.length}</b> unmatched</span>)}<label><input type="checkbox" checked={normalized} onChange={e=>onNormalize(e.target.checked)}/>Normalize</label></div>
   <div className="lens-references">{passages.map(p=><span key={p.book}>{refLabel(p)}</span>)}</div>
   <svg className="phrase-map" viewBox="0 0 560 482" role="group" aria-label="Shared wording connects the two passage rails. Amber spans are unmatched in this alignment.">
    {passages.map((p,i)=>{const ts=i===0?diff.x:diff.y,x=i===0?92:468;return <g key={p.book}><text x={x} y="21" textAnchor="middle" fill={COLORS[p.book]} className="lens-book">{NAMES[p.book]}</text><text x={x} y="37" textAnchor="middle" className="lens-ref">{p.refs.length===1?p.refs[0]:p.refs.length+' verses'}</text><rect x={x-6} y={top} width="12" height={Math.max(1,ts.length*unit)} rx="5" fill="#e6edf1"/><text x={x} y={y(ts.length)+23} textAnchor="middle" className="lens-ref">{ts.length} words</text>{words&&ts.length<=35&&ts.map((t,n)=><text key={n} x={i===0?x-15:x+15} y={y(n+.5)} dominantBaseline="middle" textAnchor={i===0?'end':'start'} className="lens-word" lang={corpus.edition==='SBLGNT'?'grc':'en'}>{t.text.length>13?t.text.slice(0,12)+'…':t.text}</text>)}</g>})}
    {spans.filter(s=>s.kind==='shared').map(s=>{const a=s.a!,b=s.b!,activeHere=active?.id===s.id,short=a.end-a.start===1;const d=`M 98 ${y(a.start)} C 230 ${y(a.start)} 330 ${y(b.start)} 462 ${y(b.start)} L 462 ${y(b.end)} C 330 ${y(b.end)} 230 ${y(a.end)} 98 ${y(a.end)} Z`;return <g key={s.id} {...interactive(s)} className="lens-hit"><path d={d} fill={activeHere?'#51869b':'#92b3c1'} opacity={activeHere?.5:short&&!words?.08:.23}/><path d={`M 98 ${y((a.start+a.end)/2)} C 230 ${y((a.start+a.end)/2)} 330 ${y((b.start+b.end)/2)} 462 ${y((b.start+b.end)/2)}`} fill="none" stroke={activeHere?'#38667d':'transparent'} strokeWidth={activeHere?1:Math.max(8,(a.end-a.start)*unit)}/><title>{excerpt(s,0)}</title></g>})}
    {spans.map(s=>[s.a,s.b].map((r,i)=>r&&<g key={s.id+'-'+i} {...interactive(s)} className="lens-hit"><rect x={i===0?84:460} y={y(r.start)} width="16" height={Math.max(1,(r.end-r.start)*unit)} rx="1" fill={s.kind==='unmatched'?'#c7a069':COLORS[passages[i].book]} opacity={active?.id===s.id?1:.6} stroke={active?.id===s.id?'#415d6d':undefined} strokeWidth={active?.id===s.id?1.5:0}/><rect x={i===0?78:454} y={y(r.start)} width="28" height={Math.max(5,(r.end-r.start)*unit)} fill="transparent"/><title>{excerpt(s,i)}</title></g>))}
   </svg>
   <div className="lens-excerpts" aria-live="polite"><div className="lens-selection-label"><span><i className={active?.kind==='unmatched'?'unique-swatch':'shared-swatch'}/>{active?.kind==='unmatched'?'Unmatched wording':'Aligned wording'}</span><div className="wording-stepper"><button aria-label="Previous wording span" disabled={!active||spans.indexOf(active)===0} onClick={()=>pick(spans[spans.indexOf(active)-1].id)}>←</button><small>{active?spans.indexOf(active)+1:0} / {spans.length}</small><button aria-label="Next wording span" disabled={!active||spans.indexOf(active)===spans.length-1} onClick={()=>pick(spans[spans.indexOf(active)+1].id)}>→</button></div></div><div className="lens-excerpt-grid">{passages.map((p,i)=>{const value=active?excerpt(active,i):'';return <div key={p.book}><strong style={{color:COLORS[p.book]}}>{NAMES[p.book]}</strong>{value?<p lang={corpus.edition==='SBLGNT'?'grc':'en'}>{value}</p>:<p className="excerpt-empty">No aligned words here.</p>}</div>})}</div></div>
   <p className="lens-method">Hover to preview; select a band or use the arrows to pin wording. Passage rails share a word-count scale; they start together for close comparison. {words?'Every aligned run is emphasized.':'Single-word bands are muted.'} Amber means unmatched here, without implying an author added or removed words. Excerpts preserve the source characters.</p>
  </>}
 </section>
}
