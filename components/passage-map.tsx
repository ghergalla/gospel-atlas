"use client";
import {useEffect,useRef,useState,useId} from 'react';
import {NAMES,COLORS,bookPosition,isSourceSection,makeReading} from '@/lib/gospel';
import type {Index,Group,Book} from '@/lib/gospel';
const BOOK_IDS=['MAT','MRK','LUK','JHN'];
function useWidth(){const ref=useRef<HTMLDivElement>(null);const [size,setSize]=useState({width:720,height:560});useEffect(()=>{if(!ref.current)return;const ob=new ResizeObserver(entries=>setSize({width:Math.max(240,entries[0].contentRect.width),height:entries[0].contentRect.height}));ob.observe(ref.current);return()=>ob.disconnect()},[]);return {ref,...size};}

export function PassageMap({index,books,group,groups,onSelect,onRead,onPreview,view,zoom,scale,focus,locked,preview,immersive=false,onUnlock}:{index:Index;books:string[];group:Group;groups:Group[];onSelect:(g:Group)=>void;onRead:(b:string,c:number)=>void;onPreview:(g:Group)=>void;view:string;zoom:number;scale:string;focus:boolean;locked:boolean;preview?:Group;immersive?:boolean;onUnlock?:()=>void}){
 const {ref,width,height:availableHeight}=useWidth();const scroll=useRef<HTMLDivElement>(null);
 const gradientId=useId();const gesture=useRef<{pointer:number;last?:Group}|undefined>(undefined);const suppressClick=useRef(false);
 const [chapterHover,setChapterHover]=useState<{book:string;chapter:number}>();
 const [chapterFocus,setChapterFocus]=useState<Record<string,number>>({});
 useEffect(()=>setChapterHover(undefined),[view,books.join(','),scale]);
 const visible=index.books.filter(b=>books.includes(b.id)).sort((a,b)=>books.indexOf(a.id)-books.indexOf(b.id));
 const selected=locked?group:preview||group;const shown=focus?[group]:groups.filter(isSourceSection);
 if(zoom>=2&&view==='columns'&&!focus){const parent=group.parentId||group.id;shown.push(...groups.filter(g=>g.parentId===parent));}
 if(!shown.some(g=>g.id===group.id))shown.push(group);
 const height=immersive?Math.max(100,availableHeight):view==='circle'?Math.max(360,Math.min(550,width)):Math.round(560*zoom);const margin=immersive&&height<400?32:50,range=height-2*margin;
 const max=Math.max(...visible.map(b=>b.words));const x=(id:string)=>48+(width-96)*(books.indexOf(id)+.5)/books.length;
 const y=(b:Book,offset:number)=>margin+(offset/(scale==='equal'?b.words:max))*range;
 const getPos=(g:Group,b:string)=>{const p=g.passages.find(p=>p.book===b);const book=visible.find(v=>v.id===b);return p&&book?bookPosition(book,p):null};
 const conn=shown.flatMap(g=>g.pairs.filter(p=>books.includes(p.a)&&books.includes(p.b)).map((p,i)=>({g,p,id:g.id+'-'+i})));

 useEffect(()=>{if(scroll.current&&zoom>1&&view==='columns'){const positions=group.passages.filter(p=>books.includes(p.book)).map(p=>{const b=index.books.find(b=>b.id===p.book)!;return margin+bookPosition(b,p).middle/(scale==='equal'?b.words:max)*range});if(positions.length)scroll.current.scrollTop=Math.max(0,(Math.min(...positions)+Math.max(...positions))/2-scroll.current.clientHeight/2);}},[zoom,group.id,scale,view,books.join(',')]);
 const center={x:width/2,y:height/2};const radius=Math.min(width/2-60,height/2-47);const gap=.17;
 const total=visible.reduce((s,b)=>s+(scale==='equal'?1:b.words),0);let angle=-Math.PI/2;
 const arcs=visible.map(b=>{const size=(Math.PI*2-visible.length*gap)*(scale==='equal'?1:b.words)/total;const a={book:b,start:angle,end:angle+size};angle+=size+gap;return a;});
 const point=(a:number,r=radius)=>({x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r});
 const arcPath=(a:number,b:number,r=radius)=>{const u=point(a,r),v=point(b,r);return `M ${u.x} ${u.y} A ${r} ${r} 0 ${b-a>Math.PI?1:0} 1 ${v.x} ${v.y}`};
 const circlePos=(g:Group,b:string)=>{const arc=arcs.find(a=>a.book.id===b)!;const pos=getPos(g,b);return point(arc.start+(pos?.middle||0)/arc.book.words*(arc.end-arc.start),radius-14)};
 // Labels sit just inside the chapter ring, leaving the Gospel names outside.
 // Prefer selected chapters and useful landmarks, then fill the available space.
 const circleChapters=arcs.flatMap(a=>Array.from({length:a.book.chapters},(_,i)=>{
  const chapter=i+1,v=a.book.verses.find(v=>v.ref.startsWith(chapter+':'))!;
  const next=a.book.verses.find(v=>v.ref.startsWith((chapter+1)+':'));
  const start=a.start+v.offset/a.book.words*(a.end-a.start),end=a.start+(next?.offset??a.book.words)/a.book.words*(a.end-a.start);
  const position=point((start+end)/2,radius-25);
  const active=selected.passages.some(p=>p.book===a.book.id&&p.refs.some(r=>Number(r.split(':')[0])===chapter));
  const hovered=chapterHover?.book===a.book.id&&chapterHover.chapter===chapter;
  return {book:a.book,chapter,start,end,position,active,hovered,id:a.book.id+'-'+chapter,priority:hovered?5:active?4:chapter===1?3:chapter%5===0||chapter===a.book.chapters?2:1};
 }));
 const labelBoxes:{x:number;y:number;width:number}[]=[];const chapterLabels=new Set<string>();
 for(const c of [...circleChapters].sort((a,b)=>b.priority-a.priority)){
  const box={x:c.position.x,y:c.position.y,width:String(c.chapter).length*7.5+10};
  if(!labelBoxes.some(b=>Math.abs(b.x-box.x)<(b.width+box.width)/2&&Math.abs(b.y-box.y)<21)){
   labelBoxes.push(box);chapterLabels.add(c.id);
  }
 }
 function chapterKey(e:React.KeyboardEvent<SVGGElement>,book:Book,chapter:number){
  if(e.key==='Enter'||e.key===' '){e.preventDefault();onRead(book.id,chapter);return;}
  const next=e.key==='ArrowRight'||e.key==='ArrowDown'?chapter+1:e.key==='ArrowLeft'||e.key==='ArrowUp'?chapter-1:e.key==='Home'?1:e.key==='End'?book.chapters:undefined;
  if(next===undefined)return;e.preventDefault();const c=Math.max(1,Math.min(book.chapters,next));setChapterFocus(f=>({...f,[book.id]:c}));
  (e.currentTarget.parentElement?.querySelector(`[data-circle-chapter="${c}"]`) as SVGGElement|null)?.focus();
 }

 // Captured pointers continue to scrub even after leaving the original SVG path.
 // Only this opt-in full-screen surface owns a one-finger drag; the normal page scrolls.
 function hitAt(clientX:number,clientY:number):Group|undefined{
  const svg=scroll.current?.querySelector('svg');if(!svg)return;
  const rect=svg.getBoundingClientRect(),px=clientX-rect.left,py=clientY-rect.top;
  if(px<0||py<0||px>width||py>height)return;
  const hit=document.elementFromPoint(clientX,clientY)?.closest('[data-passage-id]');
  if(hit&&svg.contains(hit)){const id=hit.getAttribute('data-passage-id');return shown.find(g=>g.id===id);}
  let book:Book|undefined,offset:number|undefined;
  if(view==='columns'){
   book=visible.reduce((best,b)=>Math.abs(px-x(b.id))<Math.abs(px-x(best.id))?b:best,visible[0]);
   if(py<margin||py>y(book,book.words))return;
   offset=(py-margin)/range*(scale==='equal'?book.words:max);
  }else{
   const dx=px-center.x,dy=py-center.y,distance=Math.hypot(dx,dy);if(Math.abs(distance-radius)>36)return;
   let a=Math.atan2(dy,dx);if(a< -Math.PI/2)a+=Math.PI*2;
   const arc=arcs.find(v=>a>=v.start&&a<=v.end);if(!arc)return;
   book=arc.book;offset=(a-arc.start)/(arc.end-arc.start)*book.words;
  }
  if(!book||offset===undefined)return;
  const verse=book.verses.find(v=>offset!>=v.offset&&offset!<v.offset+v.words)||book.verses.at(-1)!;
  const candidates=shown.filter(g=>isSourceSection(g)&&g.passages.some(p=>p.book===book!.id&&p.refs.includes(verse.ref)));
  // Prefer the most bounded source section when outline ranges overlap.
  candidates.sort((a,b)=>a.passages.find(p=>p.book===book!.id)!.refs.length-b.passages.find(p=>p.book===book!.id)!.refs.length);
  return candidates[0]||makeReading(book.id,Number(verse.ref.split(':')[0]),undefined,index);
 }
 function scrub(e:React.PointerEvent<SVGSVGElement>){const state=gesture.current;if(!state||state.pointer!==e.pointerId)return;const next=hitAt(e.clientX,e.clientY);if(next&&next.id!==state.last?.id){state.last=next;onPreview(next);}}
 function startScrub(e:React.PointerEvent<SVGSVGElement>){if(!immersive||e.button!==0||!e.isPrimary)return;e.preventDefault();suppressClick.current=true;gesture.current={pointer:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);onUnlock?.();scrub(e);}
 function finishScrub(e:React.PointerEvent<SVGSVGElement>){if(gesture.current?.pointer!==e.pointerId)return;scrub(e);const last=gesture.current.last;gesture.current=undefined;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(last)onSelect(last);}

 return <div ref={ref} className={"map-shell "+(immersive?"map-immersive":"")}><div className={'map-scroll '+(view==='circle'?'circle-scroll':'')} ref={scroll}>
  <svg onPointerDown={startScrub} onPointerMove={scrub} onPointerUp={finishScrub} onPointerCancel={()=>{gesture.current=undefined}} onLostPointerCapture={()=>{gesture.current=undefined}} onClickCapture={e=>{if(immersive&&suppressClick.current&&e.detail!==0){e.preventDefault();e.stopPropagation();suppressClick.current=false}}} className="passage-map" width={width} height={height} role="group" aria-label={`${view==='circle'?'Circular':'Column'} passage map. ${books.map(b=>NAMES[b]).join(', ')}. ${view==='circle'?'Chapter numbers open the text. Use arrow keys to move between chapters.':'Use the passage list for keyboard navigation.'}`}>
   <defs>{BOOK_IDS.map(b=><linearGradient key={b} id={gradientId+'-wash-'+b} x1="0" y1="0" x2="1" y2="0"><stop stopColor={COLORS[b]} stopOpacity=".13"/><stop offset="1" stopColor={COLORS[b]} stopOpacity=".32"/></linearGradient>)}</defs>
   {view==='columns'?<>
    {conn.sort((a,b)=>Number(a.g.id===selected.id)-Number(b.g.id===selected.id)).map(({g,p,id})=>{const a=visible.find(b=>b.id===p.a)!,b=visible.find(b=>b.id===p.b)!,pa=getPos(g,p.a)!,pb=getPos(g,p.b)!;const ax=x(p.a),bx=x(p.b),ay=y(a,pa.middle),by=y(b,pb.middle),active=g.id===selected.id;const ah=Math.max(1,pa.weight/(scale==='equal'?a.words:max)*range/2),bh=Math.max(1,pb.weight/(scale==='equal'?b.words:max)*range/2);const mid=(ax+bx)/2;const path=`M ${ax} ${ay-ah} C ${mid} ${ay-ah} ${mid} ${by-bh} ${bx} ${by-bh} L ${bx} ${by+bh} C ${mid} ${by+bh} ${mid} ${ay+ah} ${ax} ${ay+ah} Z`;return <g key={id} className="map-hit" data-passage-id={g.id} role="button" aria-label={`Lock ${g.title}: ${NAMES[p.a]} and ${NAMES[p.b]}`} aria-pressed={locked&&g.id===group.id} tabIndex={g.id===selected.id?0:-1} onFocus={()=>{if(!locked)onPreview(g)}} onPointerEnter={e=>{if(!locked&&e.pointerType!=='touch'&&!gesture.current)onPreview(g)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(g)}}} onClick={()=>onSelect(g)}><path d={path} fill={active?`url(#${gradientId}-wash-${p.a})`:COLORS[p.a]} opacity={active?1:.055}/><path d={`M ${ax} ${ay} C ${mid} ${ay} ${mid} ${by} ${bx} ${by}`} fill="none" stroke={active?COLORS[p.a]:'#91a1b3'} strokeWidth={active?1.6:.7} opacity={active?.85:.22} strokeDasharray={p.relation==='related'||p.relation==='shared-teaching'||p.relation==='event-disputed'?'5 4':undefined}/><path d={`M ${ax} ${ay} C ${mid} ${ay} ${mid} ${by} ${bx} ${by}`} fill="none" stroke="transparent" strokeWidth="11"><title>{g.title} · {NAMES[p.a]} ↔ {NAMES[p.b]}</title></path></g>})}
    {visible.map(b=><g key={b.id}><rect x={x(b.id)-9} y={margin} width="18" height={y(b,b.words)-margin} rx="5" fill="#edf1f5"/>{Array.from({length:b.chapters},(_,i)=>i+1).map(c=>{const vs=b.verses.filter(v=>Number(v.ref.split(':')[0])===c);const py=y(b,vs[0].offset);const end=vs.at(-1)!;const ph=y(b,end.offset+end.words)-py;return <g key={c} onClick={()=>onRead(b.id,c)} className="map-hit"><rect x={x(b.id)-9} y={py} width="18" height={Math.max(1,ph-1)} fill={COLORS[b.id]} opacity={c%2?.26:.17}/>{(zoom>=1.7||c===1||c%5===0)&&<text className="chapter-label" x={x(b.id)-17} y={py+11} textAnchor="end">{c}</text>}<title>{NAMES[b.id]} {c} · Read chapter</title></g>})}
      {[selected].flatMap(g=>g.passages.filter(p=>p.book===b.id).flatMap(p=>{const selectedRefs=new Set(p.refs);return b.verses.filter(v=>selectedRefs.has(v.ref)).map(v=><rect key={g.id+v.ref} x={x(b.id)-10} y={y(b,v.offset)} width="20" height={Math.max(2,y(b,v.offset+v.words)-y(b,v.offset))} fill={COLORS[b.id]} rx="1" pointerEvents="none"/>)}))}
      {zoom>=4&&b.verses.filter(v=>selected.passages.some(p=>p.book===b.id&&p.refs.includes(v.ref))).filter(((lastY:number)=>(v:Book['verses'][number])=>{const py=y(b,v.offset);if(py-lastY<15)return false;lastY=py;return true;})(-Infinity)).map(v=><text key={v.ref} className="verse-map-label" x={x(b.id)+17} y={y(b,v.offset)+11}>{v.ref}</text>)}
      <text className="map-book-label" fill={COLORS[b.id]} x={x(b.id)} y="25" textAnchor="middle">{b.name}</text><text className="chapter-label" x={x(b.id)} y={y(b,b.words)+24} textAnchor="middle">{b.chapters} chapters</text>
    </g>)}
   </>:<>
    {conn.sort((a,b)=>Number(a.g.id===selected.id)-Number(b.g.id===selected.id)).map(({g,p,id})=>{const a=circlePos(g,p.a),b=circlePos(g,p.b),active=g.id===selected.id;const d=`M ${a.x} ${a.y} Q ${center.x} ${center.y} ${b.x} ${b.y}`;return <g key={id} data-passage-id={g.id} role="button" aria-label={`Lock ${g.title}: ${NAMES[p.a]} and ${NAMES[p.b]}`} aria-pressed={locked&&g.id===group.id} tabIndex={g.id===selected.id?0:-1} onFocus={()=>{if(!locked)onPreview(g)}} onPointerEnter={e=>{if(!locked&&e.pointerType!=='touch'&&!gesture.current)onPreview(g)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(g)}}} onClick={()=>onSelect(g)} className="map-hit"><path d={d} fill="none" stroke={active?COLORS[p.a]:'#9aabba'} strokeWidth={active?2.4:.8} opacity={active?.85:.14} strokeDasharray={p.relation==='related'||p.relation==='shared-teaching'||p.relation==='event-disputed'?'5 4':undefined}/><path d={d} fill="none" stroke="transparent" strokeWidth="10"><title>{g.title}</title></path></g>})}
    {arcs.map(a=><g key={a.book.id}>
     <path d={arcPath(a.start,a.end)} fill="none" stroke={COLORS[a.book.id]} strokeWidth="16" opacity=".26" strokeLinecap="round"/>
     {circleChapters.filter(c=>c.book.id===a.book.id).map(c=>{
      const q=point(c.start,radius-10),r=point(c.start,radius+9),show=chapterLabels.has(c.id);
      const tabChapter=chapterFocus[a.book.id]||circleChapters.find(c=>c.book.id===a.book.id&&c.active)?.chapter||1;
      return <g key={c.chapter} className={'map-hit circle-chapter '+(c.active?'chapter-active':'')} data-circle-book={a.book.id} data-circle-chapter={c.chapter} role="button" aria-label={`Read ${a.book.name} chapter ${c.chapter}`} aria-pressed={selected.id===`read-${a.book.id}-${c.chapter}`} tabIndex={c.chapter===tabChapter?0:-1} onClick={()=>onRead(a.book.id,c.chapter)} onFocus={()=>{setChapterFocus(f=>({...f,[a.book.id]:c.chapter}));setChapterHover({book:a.book.id,chapter:c.chapter})}} onBlur={()=>setChapterHover(undefined)} onPointerEnter={e=>{if(e.pointerType!=='touch')setChapterHover({book:a.book.id,chapter:c.chapter})}} onPointerLeave={e=>{if(e.currentTarget!==document.activeElement)setChapterHover(undefined)}} onKeyDown={e=>chapterKey(e,a.book,c.chapter)}>
       <path className="chapter-arc-target" d={arcPath(c.start,c.end)} fill="none" stroke="transparent" strokeWidth="28"/>
       <line x1={q.x} y1={q.y} x2={r.x} y2={r.y} stroke="#fff" strokeWidth="2" pointerEvents="none"/>
       {show&&<><rect className="chapter-number-bg" x={c.position.x-String(c.chapter).length*3.75-4} y={c.position.y-10} width={String(c.chapter).length*7.5+8} height="20" rx="5"/>
       <text className="circle-chapter-label" x={c.position.x} y={c.position.y} textAnchor="middle" dominantBaseline="central" fill={COLORS[a.book.id]}>{c.chapter}</text></>}
       <title>{a.book.name} {c.chapter} · Read chapter</title>
      </g>;
     })}
     {selected.passages.filter(p=>p.book===a.book.id).flatMap(p=>a.book.verses.filter(v=>p.refs.includes(v.ref)).map(v=><path key={v.ref} d={arcPath(a.start+v.offset/a.book.words*(a.end-a.start),a.start+(v.offset+Math.max(1,v.words))/a.book.words*(a.end-a.start))} fill="none" stroke={COLORS[a.book.id]} strokeWidth="19" pointerEvents="none"/>))}
     {(()=>{const p=point((a.start+a.end)/2,radius+25);return <text className="map-book-label" x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={COLORS[a.book.id]}>{a.book.name}</text>})()}
    </g>)}
   </>}
  </svg>
 </div>{!immersive&&<div className="map-caption"><span>{selected.title}</span><span>{view==='circle'&&chapterHover?`${NAMES[chapterHover.book]} ${chapterHover.chapter} · click or tap to read`:locked?'Passage held · Resume scrubbing above or press Esc':'Hover to preview · click or tap to lock'}</span></div>}</div>
}

