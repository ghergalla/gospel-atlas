import {computeStatistics} from './lexical-statistics.ts';
import type {Index,Corpus} from './gospel.ts';
self.onmessage=(event:MessageEvent<{index:Index;corpus:Corpus}>)=>{
 try{self.postMessage({stats:computeStatistics(event.data.index,event.data.corpus)})}
 catch{self.postMessage({error:'The wording calculation could not finish.'})}
};
