import {isExampleStudy,isRelatedTeaching,isSourceSection,makeReading,parseReading,refLabel} from './gospel.ts';
import type {Corpus,Group,Index} from './gospel.ts';

const key=(value:string)=>value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/[‘’]/g,"'").replace(/ς/g,'σ').replace(/\s+/g,' ').trim();
export type PassageSearchResult={
 direct?:Group;sections:Group[];teachings:Group[];studies:Group[];
 verses:{group:Group;text:string}[];verseCount:number;query:string;
};

// Both navigation surfaces use the same index and unmodified edition text.
export function searchPassages(index:Index,corpus:Corpus|undefined,query:string):PassageSearchResult{
 const q=key(query);
 const matches=(values:(string|undefined)[])=>!q||key(values.filter(Boolean).join(' ')).includes(q);
 const sections=index.groups.filter(g=>!isExampleStudy(g)&&!isRelatedTeaching(g)&&(q||isSourceSection(g))&&matches([g.title,g.sourceRefs,g.section,...g.passages.map(refLabel)]));
 const teachings=index.groups.filter(g=>isRelatedTeaching(g)&&matches([g.title,g.sourceRefs,g.searchTerms]));
 const studies=index.groups.filter(g=>isExampleStudy(g)&&matches([g.title,g.sourceRefs]));
 const verses:PassageSearchResult['verses']=[];let verseCount=0;
 if(corpus&&q.length>=3)for(const book of index.books)for(const [ref,text] of Object.entries(corpus.books[book.id]||{})){
  if(!key(text).includes(q))continue;
  verseCount++;
  if(verses.length>=20)continue;
  const [chapter,verse]=ref.split(':').map(Number),group=makeReading(book.id,chapter,verse,index);
  if(group)verses.push({group,text});
 }
 return {direct:parseReading(query,index),sections,teachings,studies,verses,verseCount,query:q};
}

export function firstSearchResult(result:PassageSearchResult){
 return result.direct||result.teachings[0]||result.sections[0]||result.studies[0]||result.verses[0]?.group;
}
