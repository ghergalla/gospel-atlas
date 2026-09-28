import type {Corpus} from './gospel';

const EDITIONS = ['BSB', 'ASV', 'SBLGNT'];
const BOOKS = ['MAT', 'MRK', 'LUK', 'JHN'];
type Fetcher = (url:string, init?:RequestInit) => Promise<Response>;

class TextRequestError extends Error {
  status:number;
  constructor(status:number){super(`HTTP ${status}`);this.status=status;}
}

// Validate the response, without transforming any Scripture characters.
export function isCorpus(value:unknown, edition:string):value is Corpus {
  if(!value||typeof value!=='object')return false;
  const c=value as Corpus;
  return c.edition===edition && !!c.books && !!c.notes && BOOKS.every(b=>{
    const verses=c.books[b],notes=c.notes[b];
    return !!verses && typeof verses==='object' && !Array.isArray(verses) && Object.keys(verses).length>0 &&
      Object.entries(verses).every(([r,t])=>/^\d+:\d+$/.test(r)&&typeof t==='string') &&
      !!notes && typeof notes==='object' && !Array.isArray(notes) &&
      Object.values(notes).every(n=>Array.isArray(n)&&n.every(v=>typeof v==='string'));
  });
}

export function createCorpusLoader(fetcher:Fetcher=(url,init)=>fetch(url,init), options:{timeoutMs?:number;retryDelays?:number[]}={}) {
  const cache=new Map<string,Corpus>();
  const pending=new Map<string,Promise<Corpus>>();
  const delays=options.retryDelays??[300,1000];
  const timeout=options.timeoutMs??12000;

  async function request(edition:string):Promise<Corpus>{
    let failure:unknown;
    for(let attempt=0;attempt<=delays.length;attempt++){
      if(attempt)await new Promise(resolve=>setTimeout(resolve,delays[attempt-1]));
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),timeout);
      try{
        const response=await fetcher(`./data/${edition}.json`,{credentials:'same-origin',cache:attempt?'reload':'default',signal:controller.signal});
        if(!response.ok)throw new TextRequestError(response.status);
        const value:unknown=await response.json();
        if(!isCorpus(value,edition))throw new Error('Unexpected text file');
        cache.set(edition,value);
        return value;
      }catch(error){failure=error;}finally{clearTimeout(timer);}
    }
    const reason=failure instanceof TextRequestError?` (HTTP ${failure.status})`:failure instanceof Error&&failure.name==='AbortError'?' (request timed out)':failure instanceof Error&&failure.message==='Unexpected text file'?' (unexpected file contents)':'';
    throw new Error(`${edition} could not be loaded after ${delays.length+1} attempts${reason}. Check your connection and retry.`);
  }

  function load(edition:string):Promise<Corpus>{
    if(!EDITIONS.includes(edition))return Promise.reject(new Error('Unknown Bible edition.'));
    if(cache.has(edition))return Promise.resolve(cache.get(edition)!);
    const existing=pending.get(edition);
    if(existing)return existing;
    const task=request(edition).finally(()=>pending.delete(edition));
    pending.set(edition,task);
    return task;
  }
  return {load};
}
