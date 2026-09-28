export const NAMES: Record<string,string>={MAT:'Matthew',MRK:'Mark',LUK:'Luke',JHN:'John'};
export const COLORS: Record<string,string>={MAT:'#286e87',MRK:'#925c2c',LUK:'#715797',JHN:'#337364'};
export type Passage={book:string;refs:string[]};
export type Note={label:string;text:string;source:string;url:string};
export type Group={id:string;section:string;title:string;sourceTitle:string;sourceRefs:string;passages:Passage[];kind:string;status:string;sourceUrl:string;notes:Note[];pairs:{a:string;b:string;relation:string}[];parentId?:string;subsectionIds?:string[];referenceAudit?:string;sourceLabel?:string;searchTerms?:string;contextIds?:string[]};
export const isSourceSection=(g:Group)=>g.kind==='source-group'||g.kind==='disputed';
export const isExampleStudy=(g:Group)=>g.kind==='focused'||g.kind==='related';
export const isRelatedTeaching=(g:Group)=>g.kind==='related-teaching';
export type VersePosition={ref:string;offset:number;words:number};
export type Book={id:string;name:string;chapters:number;words:number;verses:VersePosition[]};
export type Index={revision:string;books:Book[];groups:Group[];sourceSections:number;reviewedReferenceRows:number;sourceSubsections:number;editorialUnits:number;referenceAudit:{checked:number;agree:number;knownBoundaryVariations:number};editions:{id:string;name:string;license:string;url:string}[]};
export type Corpus={edition:string;books:Record<string,Record<string,string>>;notes:Record<string,Record<string,string[]>>};
export type Token={text:string;start:number;end:number;key:string};
export function tokens(text:string,normalized=true):Token[]{return [...text.matchAll(/[\p{L}\p{M}\p{N}]+(?:['’ʼ][\p{L}\p{M}]+)*['’ʼ]?/gu)].map(m=>({text:m[0],start:m.index!,end:m.index!+m[0].length,key:normalized?m[0].normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('el').replace(/ς/g,'σ').replace(/[’ʼ]/g,"'"):m[0]}));}
export function passageText(p:Passage,c:Corpus){return p.refs.map(r=>c.books[p.book]?.[r]??'').filter(Boolean).join(' ');}
export function refLabel(p:Passage){if(!p.refs.length)return NAMES[p.book];const segments:string[][]=[];for(const r of p.refs){const last=segments.at(-1);if(last){const a=last.at(-1)!.split(':').map(Number),b=r.split(':').map(Number);if(a[0]===b[0]&&b[1]===a[1]+1){last.push(r);continue;}}segments.push([r]);}return `${NAMES[p.book]} ${segments.map(s=>s.length===1?s[0]:s[0]+'–'+s.at(-1)!.split(':')[1]).join(', ')}`;}
export const ALIGNMENT_METHOD='phrase-supported-lcs-v1';
// A deliberately conservative display rule, not a semantic or event-identity claim.
// Keep common words inside supported phrases, but never link them on their own.
const CONNECTING_WORDS=new Set(tokens(`a an the and or but if then than as at by for from in into of on onto to unto upon with without through is am are was were be been being have has had do does did shall will would should may might can could he him his she her hers it its they them their theirs you your yours thou thee thy thine ye we us our ours i me my mine this that these those which who whom whose there here so also
ο η το οι αι τα τον την του της τω τη των τοις ταις τους τας και δε τε γαρ ουν αλλα η ει εαν οτι ως εν εις εκ εξ απο επι προς δια κατα μετα παρα περι συν υπο υπερ ανα αυτος αυτον αυτου αυτω αυτην αυτης αυτο αυτοι αυτους αυτων αυτοις εαυτου εαυτον εαυτων εαυτοις ουτος τουτο τουτον τουτου τουτω ταυτα εκεινος εκεινον εγω εμε μου μοι συ σε σου σοι ημεις ημων ημιν υμεις υμων υμιν τις τι τινα τινος εστιν εστι ην ησαν εσται ων ειναι`).map(t=>t.key));
export function supportedPhrase(words:Token[]){
 return words.length>=2&&words.some(t=>!CONNECTING_WORDS.has(tokens(t.text)[0]?.key));
}
export function align(a:string,b:string,normalized=true){
 const inputX=tokens(a,normalized),inputY=tokens(b,normalized);
 if(inputX.length*inputY.length>3_000_000)return {x:inputX,y:inputY,pairs:[] as [number,number][],limited:true};
 // A canonical orientation resolves repeated-word ties identically when the
 // reader reorders Gospel columns or inspects the opposite side of a phrase.
 const reversed=inputX.map(t=>t.key).join('\0')>inputY.map(t=>t.key).join('\0');
 const [x,y]=reversed?[inputY,inputX]:[inputX,inputY],n=x.length,m=y.length;
 const table=new Uint16Array((n+1)*(m+1)),stride=m+1;
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)
  table[i*stride+j]=x[i].key===y[j].key?table[(i+1)*stride+j+1]+1:Math.max(table[(i+1)*stride+j],table[i*stride+j+1]);
 const candidates:[number,number][]=[];let i=0,j=0;
 while(i<n&&j<m){
  if(x[i].key===y[j].key)candidates.push([i++,j++]);
  else if(table[(i+1)*stride+j]>=table[i*stride+j+1])i++;else j++;
 }
 const pairs:[number,number][]=[];
 for(let start=0;start<candidates.length;){
  let end=start+1;
  while(end<candidates.length&&candidates[end][0]===candidates[end-1][0]+1&&candidates[end][1]===candidates[end-1][1]+1)end++;
  if(supportedPhrase(x.slice(candidates[start][0],candidates[end-1][0]+1)))pairs.push(...candidates.slice(start,end));
  start=end;
 }
 return {x:inputX,y:inputY,pairs:reversed?pairs.map(([i,j]):[number,number]=>[j,i]):pairs,limited:false};
}
export type WordRange={start:number;end:number}; // Zero-based, exclusive end.
export type LensHighlight={key:string;a?:WordRange;b?:WordRange};
export type AlignmentSpan={id:string;kind:'shared'|'unmatched';a?:WordRange;b?:WordRange};
export function alignmentSpans(diff:ReturnType<typeof align>):AlignmentSpan[]{
 if(diff.limited)return [];
 const result:AlignmentSpan[]=[];let a=0,b=0,i=0;
 const add=(kind:AlignmentSpan['kind'],x?:WordRange,y?:WordRange)=>result.push({id:String(result.length),kind,a:x,b:y});
 while(i<diff.pairs.length){const [x,y]=diff.pairs[i];if(a<x)add('unmatched',{start:a,end:x});if(b<y)add('unmatched',undefined,{start:b,end:y});let j=i+1;while(j<diff.pairs.length&&diff.pairs[j][0]===diff.pairs[j-1][0]+1&&diff.pairs[j][1]===diff.pairs[j-1][1]+1)j++;a=diff.pairs[j-1][0]+1;b=diff.pairs[j-1][1]+1;add('shared',{start:x,end:a},{start:y,end:b});i=j;}
 if(a<diff.x.length)add('unmatched',{start:a,end:diff.x.length});if(b<diff.y.length)add('unmatched',undefined,{start:b,end:diff.y.length});return result;
}
export function sourceExcerpt(text:string,ts:Token[],range:WordRange){return text.slice(ts[range.start].start,ts[range.end-1].end);}
export function bookPosition(book:Book,p:Passage){const included=new Set(p.refs);const positions=book.verses.filter(v=>included.has(v.ref));const weight=positions.reduce((s,v)=>s+v.words,0);const middle=weight?positions.reduce((s,v)=>s+(v.offset+v.words/2)*v.words,0)/weight:(positions[0]?.offset??0);return {middle,weight,positions};}
export function makeReading(book:string,chapter:number,verse:number|undefined,index:Index):Group|undefined{const b=index.books.find(b=>b.id===book);if(!b)return;const refs=b.verses.filter(v=>Number(v.ref.split(':')[0])===chapter&&(verse===undefined||Number(v.ref.split(':')[1])===verse)).map(v=>v.ref);if(!refs.length)return;return {id:`read-${book}-${chapter}${verse?'-'+verse:''}`,section:'',title:`${NAMES[book]} ${chapter}${verse?':'+verse:''}`,sourceTitle:'Direct text reading',sourceRefs:'',passages:[{book,refs}],kind:'reading',status:'Text reading',sourceUrl:'',notes:[],pairs:[]};}
export function parseReading(q:string,index:Index){const m=q.trim().match(/^(matthew|matt?\.?|mark|mk\.?|luke|lk\.?|john|jn\.?)\s+(\d+)(?::(\d+))?$/i);if(!m)return;const b=/^ma(t)/i.test(m[1])?'MAT':/^m/i.test(m[1])?'MRK':/^l/i.test(m[1])?'LUK':'JHN';return makeReading(b,Number(m[2]),m[3]?Number(m[3]):undefined,index);}
