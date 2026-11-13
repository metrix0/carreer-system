'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {demoKnowledge,knowledgeLabel,type CandidateKnowledge} from '@/lib/knowledge';
import KnowledgeField from './knowledge-value';
import Dialog from './dialog';
export default function Knowledge({demo,onClose}:{demo:boolean;onClose:()=>void}){
 const [data,setData]=useState<CandidateKnowledge|null>(demo?demoKnowledge:null);
 const [error,setError]=useState(''),[attempt,setAttempt]=useState(0),[query,setQuery]=useState(''),[expanded,setExpanded]=useState(false);
 useEffect(()=>{
  if(demo)return;
  let active=true;setError('');
  void supabase.rpc('get_candidate_knowledge').then(({data,error})=>{
   if(active){if(error||!data)setError('Could not load knowledge. Please retry.');else setData(data as CandidateKnowledge);}
  });return()=>{active=false;};
 },[demo,attempt]);
 const sections=data?Object.entries({...data.knowledge,identity:data.identity}):[];
 const shown=sections.filter(([key,value])=>(knowledgeLabel(key)+' '+JSON.stringify(value)).toLowerCase().includes(query.toLowerCase()));
 return <Dialog title="Knowledge" onClose={onClose}>
  <p className="knowledge-note">{demo?'Illustrative preview.':'Your complete saved recruiting profile. Only you can access it.'}</p>
  {error?<div role="alert"><p>{error}</p><button className="button secondary" onClick={()=>setAttempt(a=>a+1)}>Retry</button></div>:null}
  {!data&&!error?<p role="status">Loading…</p>:null}
  {data?<div className="knowledge-content">
   <div className="knowledge-tools"><input aria-label="Search knowledge" placeholder="Search knowledge…" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>setExpanded(x=>!x)}>{expanded?'Collapse all':'Expand all'}</button></div>
   {shown.map(([key,value])=><details key={key+'-'+expanded+'-'+Boolean(query)} open={expanded||Boolean(query)}><summary>{knowledgeLabel(key)}</summary><KnowledgeField value={value}/></details>)}
   {!shown.length?<p>No matching knowledge.</p>:null}
   <p className="knowledge-note knowledge-footer">Updated {new Date(data.updated_at).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})} · <a href="https://github.com/metrix0/carreer-system/blob/main/AGENTS.md" target="_blank" rel="noreferrer">Operating rules ↗</a></p>
  </div>:null}
 </Dialog>;
}
