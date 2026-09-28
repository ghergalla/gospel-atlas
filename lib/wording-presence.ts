import {align,isSourceSection,isRelatedTeaching,tokens,passageText,supportedPhrase} from './gospel.ts';
import type {Index,Corpus,Passage,Group} from './gospel.ts';

export type WordingMatch={groupId:string;book:string;ref:string;word:number};
export type WordingRun={start:number;end:number;books:string[];matches:WordingMatch[]};
export type WordingPresence={verses:Record<string,WordingRun[]>;groups:Group[];limited:number};
const positions=(p:Passage,c:Corpus)=>p.refs.flatMap(ref=>tokens(c.books[p.book]?.[ref]||'').map((_,word)=>({ref,word})));

// Compare the selected group, or reviewed mappings for direct chapter reading.
// A tint requires a supported consecutive phrase on BOTH sides.
// Offsets always point into the original edition; no text is reconstructed here.
export function computeWordingPresence(index:Index,corpus:Corpus,passage:Passage,comparison?:Group,normalized=true):WordingPresence{
 const refs=new Set(passage.refs),marks=new Map<string,WordingMatch[]>();let limited=0;
 // A selected group compares exactly its displayed passages. Direct
 // chapter reading can still discover all reviewed matches in the index.
 const candidates=comparison&&comparison.kind!=='reading'?[comparison]:index.groups.filter(g=>isSourceSection(g)||isRelatedTeaching(g));
 const groups=candidates.filter(g=>g.passages.some(p=>p.book===passage.book&&p.refs.some(r=>refs.has(r)))&&g.pairs.some(p=>p.a===passage.book||p.b===passage.book));
 for(const g of groups){
  const source=g.passages.find(p=>p.book===passage.book)!;const sourceWords=positions(source,corpus);
  for(const target of g.passages){
   if(target.book===source.book||!g.pairs.some(p=>[p.a,p.b].includes(source.book)&&[p.a,p.b].includes(target.book)))continue;
   const d=align(passageText(source,corpus),passageText(target,corpus),normalized);if(d.limited){limited++;continue;}
   const targetWords=positions(target,corpus);
   for(let i=0;i<d.pairs.length;){
    let end=i+1;
    while(end<d.pairs.length&&d.pairs[end][0]===d.pairs[end-1][0]+1&&d.pairs[end][1]===d.pairs[end-1][1]+1&&sourceWords[d.pairs[end][0]].ref===sourceWords[d.pairs[end-1][0]].ref&&targetWords[d.pairs[end][1]].ref===targetWords[d.pairs[end-1][1]].ref)end++;
    if(supportedPhrase(d.x.slice(d.pairs[i][0],d.pairs[end-1][0]+1)))for(let j=i;j<end;j++){
     const [a,b]=d.pairs[j],pos=sourceWords[a];if(!refs.has(pos.ref))continue;
     const key=pos.ref+':'+pos.word,match={groupId:g.id,book:target.book,...targetWords[b]};
     marks.set(key,[...(marks.get(key)||[]),match]);
    }
    i=end;
   }
  }
 }
 const verses:WordingPresence['verses']={};
 for(const ref of passage.refs){
  const words=tokens(corpus.books[passage.book]?.[ref]||'');const runs:WordingRun[]=[];
  for(let i=0;i<words.length;i++){
   const matches=marks.get(ref+':'+i)||[];
   const books=index.books.map(b=>b.id).filter(b=>matches.some(m=>m.book===b));
   const key=matches.map(m=>m.groupId+':'+m.book).sort().join('|');
   const last=runs.at(-1),previous=marks.get(ref+':'+(i-1))||[];
   if(last&&books.length&&key===previous.map(m=>m.groupId+':'+m.book).sort().join('|')&&matches.every(m=>previous.some(v=>v.groupId===m.groupId&&v.book===m.book&&v.ref===m.ref&&v.word+1===m.word))){last.end=words[i].end;last.matches.push(...matches);}
   else runs.push({start:words[i].start,end:words[i].end,books,matches:[...matches]});
  }
  verses[ref]=runs;
 }
 return {verses,groups,limited};
}
