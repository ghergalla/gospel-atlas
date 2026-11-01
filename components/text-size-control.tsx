import {TEXT_SIZES,stepTextSize} from '@/lib/reader-preferences';

export function TextSizeControl({size,onChange}:{size:number;onChange:(size:number)=>void}) {
 return <div className="text-size-control" role="group" aria-label="Scripture text size">
  <button type="button" aria-label="Decrease text size" title="Smaller text" disabled={size<=TEXT_SIZES[0]} onClick={()=>onChange(stepTextSize(size,-1))}><span aria-hidden="true">A−</span></button>
  <button type="button" className="text-size-reset" aria-label={`Text size ${size}%. Reset to 100%`} title="Reset text size" onClick={()=>onChange(100)}><span aria-live="polite" aria-atomic="true">{size}%</span></button>
  <button type="button" aria-label="Increase text size" title="Larger text" disabled={size>=TEXT_SIZES[TEXT_SIZES.length-1]} onClick={()=>onChange(stepTextSize(size,1))}><span aria-hidden="true">A+</span></button>
 </div>;
}
