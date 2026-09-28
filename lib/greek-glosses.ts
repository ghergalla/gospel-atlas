import {useEffect,useState} from 'react';
export type Glosses={meta:{source:string;url:string;license:string};entries:[string,string,string][];books:Record<string,Record<string,(number|null)[]>>};
let cached:Glosses|undefined;let pending:Promise<Glosses>|undefined;
export function useGlosses(enabled:boolean){
 const [data,setData]=useState(cached),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(!enabled)return;let live=true;setError(false);
  if(cached){setData(cached);return;}
  if(!pending)pending=fetch('./data/greek-glosses.json').then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Glosses>;}).then((d:Glosses)=>{if(!d.entries||!d.books)throw Error();cached=d;return d;}).finally(()=>{pending=undefined});
  pending.then(d=>{if(live)setData(d)}).catch(()=>{if(live)setError(true)});return()=>{live=false};
 },[enabled,attempt]);
 return {data,error,retry:()=>setAttempt(n=>n+1)};
}
