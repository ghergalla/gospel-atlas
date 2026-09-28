import type {CSSProperties} from 'react';

// Patterns supplement color; all three possible partner lines keep the same
// spacing and survive natural inline wrapping through box-decoration-break.
export const WORDING_STYLES:Record<string,{color:string;pattern:string;image:string}>={
 MAT:{color:'#0067a5',pattern:'solid',image:'linear-gradient(#0067a5,#0067a5)'},
 MRK:{color:'#b64a09',pattern:'dashed',image:'repeating-linear-gradient(90deg,#b64a09 0 7px,transparent 7px 11px)'},
 LUK:{color:'#8b238a',pattern:'dot-dash',image:'repeating-linear-gradient(90deg,#8b238a 0 3px,transparent 3px 6px,#8b238a 6px 14px,transparent 14px 18px)'},
 JHN:{color:'#00734f',pattern:'dotted',image:'radial-gradient(circle at 1.5px 1.5px,#00734f 1.5px,transparent 1.6px)'},
};

export function wordingLineStyle(books:string[]):CSSProperties{
 return {
  backgroundImage:books.map(b=>WORDING_STYLES[b].image).join(','),
  backgroundSize:books.map(b=>b==='JHN'?'6px 3px':'100% 3px').join(','),
  backgroundRepeat:books.map(b=>b==='JHN'?'repeat-x':'no-repeat').join(','),
  backgroundPosition:books.map((_,i)=>`left calc(100% - ${i*5}px)`).join(','),
 };
}
