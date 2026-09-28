"use client";

import {RotateCcw} from 'lucide-react';

export function TextLoadState({edition,error,onRetry}:{edition:string;error?:string;onRetry:()=>void}){
  if(!error)return <p className="loading" role="status">Loading {edition} text…</p>;
  return <div className="text-load-error" role="alert"><strong>Text unavailable</strong><p>{error}</p><button className="secondary-button" onClick={onRetry}><RotateCcw size={15}/>Retry {edition}</button></div>;
}
