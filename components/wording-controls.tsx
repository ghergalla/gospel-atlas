import {NAMES} from '@/lib/gospel';
import {wordingLineStyle,WORDING_STYLES} from '@/lib/wording-style';

export function WordingControls({books}:{books:string[]}){
 if(!books.length)return null;
 return <div className="wording-legend" aria-label="Gospel underline key">{books.map(b=><span key={b} title={NAMES[b]+' · '+WORDING_STYLES[b].pattern}><i aria-hidden="true" style={wordingLineStyle([b])}/>{NAMES[b]}<span className="sr-only"> · {WORDING_STYLES[b].pattern} underline</span></span>)}</div>;
}
