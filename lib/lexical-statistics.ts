import {align,isSourceSection,passageText,tokens,ALIGNMENT_METHOD} from './gospel.ts';
import type {Index,Corpus,Passage} from './gospel.ts';
export type LexicalRow={id:string;aWords:number;bWords:number;matched:number;score:number|null;limited:boolean};
export type LexicalSide={total:number;grouped:number;examined:number;matched:number;unmatched:number;unexamined:number;outside:number};
export type LexicalPair={a:string;b:string;left:LexicalSide;right:LexicalSide;rows:LexicalRow[]};
export type LexicalStats={edition:string;revision:string;normalized:boolean;method:string;pairs:LexicalPair[]};
export function computeStatistics(index:Index,corpus:Corpus):LexicalStats{
 const ids=index.books.map(b=>b.id);const result:LexicalPair[]=[];
 const wordIds=(p:Passage)=>p.refs.flatMap(ref=>tokens(corpus.books[p.book]?.[ref]||'').map((_,i)=>ref+':'+i));
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j],rows:LexicalRow[]=[];
  const grouped=[new Set<string>(),new Set<string>()],examined=[new Set<string>(),new Set<string>()],matched=[new Set<string>(),new Set<string>()];
  for(const g of index.groups.filter(isSourceSection)){
   const pa=g.passages.find(p=>p.book===a),pb=g.passages.find(p=>p.book===b);if(!pa||!pb)continue;
   const positions=[wordIds(pa),wordIds(pb)];positions.forEach((ps,s)=>ps.forEach(p=>grouped[s].add(p)));
   const d=align(passageText(pa,corpus),passageText(pb,corpus));
   if(d.x.length!==positions[0].length||d.y.length!==positions[1].length)throw Error('Token position mismatch');
   rows.push({id:g.id,aWords:d.x.length,bWords:d.y.length,matched:d.pairs.length,score:d.limited?null:2*d.pairs.length/(d.x.length+d.y.length||1),limited:d.limited});
   if(d.limited)continue;
   positions.forEach((ps,s)=>ps.forEach(p=>examined[s].add(p)));
   d.pairs.forEach(pair=>pair.forEach((p,s)=>matched[s].add(positions[s][p])));
  }
  const side=(book:string,s:number):LexicalSide=>{const total=Object.values(corpus.books[book]).reduce((n,t)=>n+tokens(t).length,0);return {total,grouped:grouped[s].size,examined:examined[s].size,matched:matched[s].size,unmatched:examined[s].size-matched[s].size,unexamined:grouped[s].size-examined[s].size,outside:total-grouped[s].size};};
  result.push({a,b,left:side(a,0),right:side(b,1),rows});
 }
 return {edition:corpus.edition,revision:index.revision,normalized:true,method:ALIGNMENT_METHOD,pairs:result};
}
