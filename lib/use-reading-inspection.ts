import {useCallback,useEffect,useReducer,useRef} from 'react';
import {emptyInspection,inspectionKey,inspectionReducer} from './reading-inspection';
import type {InspectionAction,ReadingTarget} from './reading-inspection';

export function useReadingInspection(context:string){
 const [state,dispatch]=useReducer(inspectionReducer,emptyInspection),latest=useRef(state);
 const anchor=useRef<HTMLElement|null>(null),keyboard=useRef(false),suppressFocus=useRef<HTMLElement|null>(null);
 const ignorePointerUntil=useRef(0);
 const openTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),closeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const clear=useCallback(()=>{clearTimeout(openTimer.current);clearTimeout(closeTimer.current)},[]);
 const send=useCallback((action:InspectionAction)=>{latest.current=inspectionReducer(latest.current,action);dispatch(action)},[]);
 const close=useCallback((restore=false)=>{
  clear();if(restore)ignorePointerUntil.current=Date.now()+350;send({type:'dismiss'});
  if(restore&&anchor.current?.isConnected){suppressFocus.current=anchor.current;anchor.current.focus({preventScroll:true});suppressFocus.current=null;}
 },[clear,send]);
 const preview=useCallback((target:ReadingTarget,element:HTMLElement,fromKeyboard=false)=>{
  if(latest.current.phase==='pinned'||suppressFocus.current===element||(!fromKeyboard&&Date.now()<ignorePointerUntil.current))return;
  clear();anchor.current=element;keyboard.current=false;send({type:'preview',target});
  if(fromKeyboard)send({type:'open',key:inspectionKey(target)});
  else openTimer.current=setTimeout(()=>send({type:'open',key:inspectionKey(target)}),250);
 },[clear,send]);
 const pin=useCallback((target:ReadingTarget,element:HTMLElement,fromKeyboard=false)=>{
  clear();anchor.current=element;keyboard.current=fromKeyboard;send({type:'pin',target});
 },[clear,send]);
 const hold=useCallback(()=>{clear();if(latest.current.target)send({type:'pin',target:latest.current.target})},[clear,send]);
 const leave=useCallback(()=>{
  clear();if(latest.current.phase==='pinned'||anchor.current?.matches(':focus-visible'))return;
  closeTimer.current=setTimeout(()=>{
   if(!document.activeElement?.closest('[data-reading-card]'))close(false);
  },200);
 },[clear,close]);
 useEffect(()=>{close(false);return clear},[context,close,clear]);
 useEffect(()=>{
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&latest.current.phase!=='closed'){e.preventDefault();e.stopPropagation();close(true)}};
  document.addEventListener('keydown',escape,true);return()=>document.removeEventListener('keydown',escape,true);
 },[close]);
 return {state,anchor,keyboard:keyboard.current,preview,pin,hold,leave,close,keepOpen:clear};
}
