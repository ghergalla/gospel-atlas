/// <reference types="vite/client" />
import StatisticsWorker from './statistics.worker?worker';
import type {Index} from './gospel';
import type {LexicalStats} from './lexical-statistics';
import {corpusLoader} from './use-corpus';
export async function recoverStatistics(index:Index,edition:string):Promise<LexicalStats>{
 const corpus=await corpusLoader.load(edition);
 return new Promise((resolve,reject)=>{
  const worker=(()=>{try{return new StatisticsWorker()}catch{throw Error('This browser could not start the local statistics calculation.')}})();
  const timer=setTimeout(()=>{worker.terminate();reject(Error('The wording calculation timed out.'))},60000);
  const finish=()=>{clearTimeout(timer);worker.terminate()};
  worker.onmessage=(event:MessageEvent<{stats?:LexicalStats;error?:string}>)=>{finish();if(event.data.stats)resolve(event.data.stats);else reject(Error(event.data.error||'The wording calculation was unavailable.'))};
  worker.onerror=()=>{finish();reject(Error('The wording calculation could not start.'))};
  worker.postMessage({index,corpus});
 });
}
