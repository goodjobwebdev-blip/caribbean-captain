import {useEffect, useId, useRef, useState} from 'react';
import type {Model} from './nanogpt';

type Props = {models:Model[]; value:string; loading:boolean; onChange:(id:string)=>void};
export function ModelPicker({models,value,loading,onChange}:Props){
  const id=useId();
  const input=useRef<HTMLInputElement>(null);
  const list=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [active,setActive]=useState(0);
  const selected=models.find(model=>model.id===value);
  const matches=models.filter(model=>`${model.name??''} ${model.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  const index=Math.min(active,Math.max(0,matches.length-1));
  const label=selected?.name||value;
  function close(){setOpen(false);setQuery('');setActive(0);}
  function show(){setQuery('');setActive(Math.max(0,models.findIndex(model=>model.id===value)));setOpen(true);}
  function select(model:Model){onChange(model.id);close();input.current?.focus();}
  useEffect(()=>{if(open)list.current?.querySelector('[data-active="true"]')?.scrollIntoView({block:'nearest'});},[index,open,query]);
  return <div className="model-picker" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))close();}}>
    <label htmlFor={id}>Model</label>
    <div className="model-picker-field">
      <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open}
        aria-controls={`${id}-list`} aria-activedescendant={open&&matches.length?`${id}-option-${index}`:undefined}
        autoComplete="off" spellCheck={false} value={open?query:label} placeholder={loading?'Loading models…':'Choose or search a model…'}
        onClick={()=>{if(!open)show();}}
        onChange={event=>{setQuery(event.target.value);setActive(0);setOpen(true);}}
        onKeyDown={event=>{
          if(event.key==='ArrowDown'||event.key==='ArrowUp'){
            event.preventDefault();
            if(!open){show();return;}
            setActive(Math.max(0,Math.min(matches.length-1,index+(event.key==='ArrowDown'?1:-1))));
          }else if(event.key==='Enter'&&open){event.preventDefault();if(matches[index])select(matches[index]);}
          else if(event.key==='Escape'&&open){event.preventDefault();close();}
          else if(event.key==='Tab'){close();}
        }}/>
      <button type="button" className="model-picker-toggle" aria-label={open?'Close model list':'Open model list'} aria-expanded={open} aria-controls={`${id}-list`}
        onMouseDown={event=>event.preventDefault()} onClick={()=>{input.current?.focus();if(open)close();else show();}}><span aria-hidden="true">{open?'▴':'▾'}</span></button>
    </div>
    {open&&<div className="model-picker-popup">
      <div ref={list} id={`${id}-list`} className="model-picker-list" role="listbox" aria-label="Available models" aria-busy={loading}>
        {matches.map((model,i)=><div key={model.id} id={`${id}-option-${i}`} role="option" aria-selected={value===model.id} data-active={i===index}
          className="model-picker-option" onMouseDown={event=>event.preventDefault()} onMouseMove={()=>setActive(i)} onClick={()=>select(model)}>
          <strong>{model.name||model.id}{value===model.id&&<span aria-hidden="true"> ✓</span>}</strong>
          {model.name&&model.name!==model.id&&<small>{model.id}</small>}
        </div>)}
      </div>
      {!matches.length&&<p className="model-picker-empty" role="status">{loading?'Loading models…':models.length?'No matching models. Try another name.':'Load available models first.'}</p>}
    </div>}
  </div>;
}
