export type ReadingState={selectedId:string;previewId?:string;locked:boolean};
export type ReadingAction=
  | {type:'preview';id:string}
  | {type:'select';id:string}
  | {type:'unlock'}
  | {type:'clear-preview'}
  | {type:'restore';id:string;locked:boolean};

export function readingReducer(state:ReadingState,action:ReadingAction):ReadingState{
  switch(action.type){
    case 'preview': return state.locked||state.previewId===action.id?state:{...state,previewId:action.id};
    case 'select': return {selectedId:action.id,locked:true};
    case 'unlock': return {selectedId:state.selectedId,locked:false};
    case 'clear-preview': return state.previewId?{selectedId:state.selectedId,locked:state.locked}:state;
    case 'restore': return {selectedId:action.id,locked:action.locked};
  }
}
