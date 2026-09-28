import {useEffect,useState} from 'react';
import type {Corpus} from './gospel';
import {createCorpusLoader} from './corpus-loader';
export const corpusLoader=createCorpusLoader();
export function useCorpus(edition:string){
 const [state,setState]=useState<{edition:string;corpus?:Corpus;error?:string}>(),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(!edition)return;let live=true;corpusLoader.load(edition).then(c=>{if(live)setState({edition,corpus:c})}).catch(e=>{if(live)setState({edition,error:e.message})});return()=>{live=false}},[edition,attempt]);
 return {corpus:state?.edition===edition?state.corpus:undefined,error:state?.edition===edition?state.error:undefined,retry:()=>{setState(undefined);setAttempt(n=>n+1)}};
}
