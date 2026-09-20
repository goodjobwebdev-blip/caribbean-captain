import {useEffect,useRef} from 'react';
import type {Checkpoint} from './storage';
export function DeleteCheckpointDialog({checkpoint,busy,error,onCancel,onConfirm}:{checkpoint:Checkpoint;busy:boolean;error:string;onCancel:()=>void;onConfirm:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current!;dialog.showModal();return()=>dialog.close();},[]);
 return <dialog ref={ref} className="checkpoint-dialog" aria-labelledby="delete-checkpoint-title" aria-describedby="delete-checkpoint-description" onCancel={e=>{if(busy)e.preventDefault();else onCancel();}}>
 <h2 id="delete-checkpoint-title">Delete “{checkpoint.name}”?</h2><p id="delete-checkpoint-description">This permanently removes this checkpoint. Your current captain progress and other checkpoints are kept. You cannot undo this deletion.</p>{error&&<p className="warning" role="alert">{error}</p>}<div className="button-row"><button autoFocus disabled={busy} onClick={onCancel}>Keep checkpoint</button><button className="delete-checkpoint" disabled={busy} onClick={onConfirm}>{busy?'Deleting…':'Delete checkpoint'}</button></div></dialog>;
}
