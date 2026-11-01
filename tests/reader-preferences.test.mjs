import test from 'node:test';
import assert from 'node:assert/strict';
import {TEXT_SIZES,TEXT_SIZE_KEY,parseTextSize,stepTextSize,loadTextSize,saveTextSize} from '../lib/reader-preferences.ts';

test('text size can reach 200%, reset, and cannot step outside supported sizes',()=>{
 for(const size of TEXT_SIZES)assert.equal(parseTextSize(String(size)),size);
 for(const invalid of [null,'','NaN','-10','0','999','<script>','101'])assert.equal(parseTextSize(invalid),100);
 let size=100;
 for(let i=0;i<20;i++)size=stepTextSize(size,1);
 assert.equal(size,200);
 for(let i=0;i<20;i++)size=stepTextSize(size,-1);
 assert.equal(size,85);
});

test('reading preferences survive a new session and tolerate unavailable storage',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 assert.equal(loadTextSize(storage),100);
 saveTextSize(storage,150);
 assert.equal(loadTextSize(storage),150);
 values.set(TEXT_SIZE_KEY,'old-format');
 assert.equal(loadTextSize(storage),100);
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
 assert.equal(loadTextSize(blocked),100);
 assert.doesNotThrow(()=>saveTextSize(blocked,130));
});
