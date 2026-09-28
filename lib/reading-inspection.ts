import {tokens} from './gospel.ts';
import type {Corpus,Group} from './gospel.ts';
import type {WordingPresence,WordingRun} from './wording-presence.ts';

export type WordAddress={book:string;ref:string;word:number};
export type ReadingTarget=WordAddress&{edition:string;run?:WordingRun};
export type InspectionState={target?:ReadingTarget;phase:'closed'|'preview'|'open'|'pinned'};
export type InspectionAction={type:'preview';target:ReadingTarget}|{type:'pin';target:ReadingTarget}|{type:'open';key:string}|{type:'dismiss'};
export const emptyInspection:InspectionState={phase:'closed'};
export const wordKey=(p:WordAddress)=>`${p.book}/${p.ref}/${p.word}`;
export const inspectionKey=(p:ReadingTarget)=>`${p.edition}/${wordKey(p)}`;

export function inspectionReducer(state:InspectionState,action:InspectionAction):InspectionState{
 if(action.type==='dismiss')return emptyInspection;
 if(action.type==='preview')return state.phase==='pinned'?state:{target:action.target,phase:'preview'};
 if(action.type==='pin')return {target:action.target,phase:'pinned'};
 return state.phase==='preview'&&state.target&&inspectionKey(state.target)===action.key?{...state,phase:'open'}:state;
}

// Follow only the selected source run's direct links, never transitive matches
// or a global search for occurrences of the same word.
export function highlightedWords(target:ReadingTarget|undefined,corpus:Corpus|undefined):Set<string>{
 const result=new Set<string>();
 if(!target||!corpus||target.edition!==corpus.edition)return result;
 const words=tokens(corpus.books[target.book]?.[target.ref]||'');
 if(target.run?.books.length){
  words.forEach((t,word)=>{if(t.start>=target.run!.start&&t.end<=target.run!.end)result.add(wordKey({...target,word}))});
  target.run.matches.forEach(m=>result.add(wordKey(m)));
 }else if(words[target.word])result.add(wordKey(target));
 return result;
}

export function parallelGroups(target:ReadingTarget,presence:WordingPresence|undefined):Group[]{
 return presence?.groups.filter(g=>g.passages.some(p=>p.book===target.book&&p.refs.includes(target.ref))&&g.pairs.some(p=>p.a===target.book||p.b===target.book))||[];
}

export function partnerBooks(group:Group,target:ReadingTarget):string[]{
 return group.passages.map(p=>p.book).filter(book=>book!==target.book&&group.pairs.some(p=>[p.a,p.b].includes(book)&&[p.a,p.b].includes(target.book)));
}

export function directTargets(target:ReadingTarget,groupId:string,book:string):WordAddress[]{
 const matches=target.run?.matches.filter(m=>m.groupId===groupId&&m.book===book)||[];
 return [...new Map(matches.map(m=>[wordKey(m),{book:m.book,ref:m.ref,word:m.word}])).values()];
}
