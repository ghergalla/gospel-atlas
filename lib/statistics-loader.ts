import {isSourceSection} from './gospel.ts';
import type {Index} from './gospel.ts';
import type {LexicalStats} from './lexical-statistics.ts';
type Fetcher=(url:string,init?:RequestInit)=>Promise<Response>;
export type StatisticsResult={stats:LexicalStats;calculated:boolean};

export function validStatistics(value:unknown,index:Index,edition:string):value is LexicalStats{
 if(!value||typeof value!=='object')return false;
 const s=value as LexicalStats,ids=index.books.map(b=>b.id);
 if(s.edition!==edition||s.revision!==index.revision||s.normalized!==true||!Array.isArray(s.pairs)||s.pairs.length!==6)return false;
 const pairKeys=new Set<string>();
 return s.pairs.every(p=>{
  if(!ids.includes(p.a)||!ids.includes(p.b)||ids.indexOf(p.a)>=ids.indexOf(p.b)||pairKeys.has(p.a+p.b)||!Array.isArray(p.rows))return false;
  pairKeys.add(p.a+p.b);
  const expected=index.groups.filter(g=>isSourceSection(g)&&g.passages.some(v=>v.book===p.a)&&g.passages.some(v=>v.book===p.b)).map(g=>g.id);
  const rows=new Set<string>();
  return [p.left,p.right].every(v=>v&&['total','grouped','examined','matched','unmatched','unexamined','outside'].every(k=>Number.isSafeInteger(v[k as keyof typeof v])&&v[k as keyof typeof v]>=0)&&v.total===v.matched+v.unmatched+v.unexamined+v.outside&&v.examined===v.matched+v.unmatched&&v.grouped===v.examined+v.unexamined)&&p.rows.length===expected.length&&p.rows.every(r=>{
   if(!expected.includes(r.id)||rows.has(r.id))return false;rows.add(r.id);
   return [r.aWords,r.bWords,r.matched].every(n=>Number.isSafeInteger(n)&&n>=0)&&r.matched<=Math.min(r.aWords,r.bWords)&&typeof r.limited==='boolean'&&(r.limited?r.score===null:typeof r.score==='number'&&r.score>=0&&r.score<=1);
  });
 });
}

export function createStatisticsLoader(fetcher:Fetcher=(url,init)=>fetch(url,init),options:{timeoutMs?:number;retryDelays?:number[]}={}){
 const cache=new Map<string,StatisticsResult>(),pending=new Map<string,Promise<StatisticsResult>>();
 const delays=options.retryDelays??[350,900];
 async function request(index:Index,edition:string,fallback?:()=>Promise<LexicalStats>):Promise<StatisticsResult>{
  let reason='The statistics file could not be reached.';
  for(let attempt=0;attempt<=delays.length;attempt++){
   if(attempt)await new Promise(resolve=>setTimeout(resolve,delays[attempt-1]));
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),options.timeoutMs??10000);
   try{
    const response=await fetcher(`./data/statistics-${edition}.json?rev=${encodeURIComponent(index.revision)}`,{cache:attempt?'reload':'no-cache',credentials:'same-origin',signal:controller.signal});
    if(!response.ok)throw Error(`The statistics request returned HTTP ${response.status}.`);
    const data:unknown=await response.json().catch(()=>{throw Error('The statistics file could not be read.')});
    if(!validStatistics(data,index,edition))throw Error('The statistics file does not match this edition and passage index.');
    return {stats:data,calculated:false};
   }catch(error){reason=error instanceof Error?(error.name==='AbortError'?'The statistics request timed out.':error.message):reason;}finally{clearTimeout(timer);}
  }
  if(fallback)try{
   const stats=await fallback();if(!validStatistics(stats,index,edition))throw Error('Calculated statistics did not pass validation.');return {stats,calculated:true};
  }catch(error){reason+=' '+(error instanceof Error?error.message:'The text calculation was unavailable.');}
  throw Error(reason+' Check your connection, then retry.');
 }
 function load(index:Index,edition:string,fallback?:()=>Promise<LexicalStats>):Promise<StatisticsResult>{
  if(!index.editions.some(e=>e.id===edition))return Promise.reject(Error('Unknown Bible edition.'));
  const key=index.revision+':'+edition;
  if(cache.has(key))return Promise.resolve(cache.get(key)!);
  if(pending.has(key))return pending.get(key)!;
  const task=request(index,edition,fallback).then(result=>{cache.set(key,result);return result}).finally(()=>pending.delete(key));
  pending.set(key,task);return task;
 }
 return {load};
}
