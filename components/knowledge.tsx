'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {demoKnowledge,type CandidateKnowledge} from '@/lib/knowledge';
import Dialog from './dialog';

export default function Knowledge({demo,onClose}:{demo:boolean;onClose:()=>void}) {
  const [knowledge,setKnowledge]=useState<CandidateKnowledge|null>(demo?demoKnowledge:null);
  const [error,setError]=useState('');
  const [attempt,setAttempt]=useState(0);
  const [language,setLanguage]=useState('pt-BR');
  useEffect(()=>{
    if(demo)return;
    let active=true;
    setError('');
    void supabase.rpc('get_candidate_knowledge').then(({data,error})=>{
      if(!active)return;
      if(error)setError('Could not load your knowledge. Please retry.');
      else if(!data)setError('Candidate knowledge is not available.');
      else setKnowledge(data as CandidateKnowledge);
    });
    return()=>{active=false;};
  },[demo,attempt]);
  const brl=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
  return <Dialog title="Knowledge" onClose={onClose}>
    {error?<div role="alert" className="knowledge-error"><p>{error}</p><button className="button secondary" onClick={()=>setAttempt(a=>a+1)}>Retry</button></div>:null}
    {!knowledge&&!error?<p role="status" className="knowledge-note">Loading your knowledge…</p>:null}
    {knowledge?<div className="knowledge-content">
      <p className="knowledge-note">{demo?'Illustrative preview.':'The profile and answers used for your applications.'}</p>
      <h3>{knowledge.candidate}</h3>
      <p>{knowledge.education.course} · {knowledge.education.university}</p>
      <p>{knowledge.education.status}{knowledge.education.graduation_year?` · ${knowledge.education.graduation_year}`:''}</p>
      <p>{language==='pt-BR'?knowledge.background.pt_br:knowledge.background.en}</p>
      <details><summary>Application preferences</summary>
        <p>{knowledge.preferences.remote}{knowledge.preferences.hours_per_week?` · ${knowledge.preferences.hours_per_week}h/week`:''}{knowledge.preferences.immediate?' · Available immediately':''}</p>
        <p>{knowledge.preferences.contracts.join(' · ')}</p>
        <p>Minimum {brl(knowledge.preferences.minimum_brl_monthly)}/month · Desired {knowledge.preferences.desired_brl_monthly.map(brl).join('–')}/month</p>
      </details>
      <details><summary>Achievements</summary>
        <p>{knowledge.writing.guidance}</p>
        {knowledge.writing.strengths.map(s=><article key={s.key}><p><strong>{s.claim}</strong></p>{s.current_metrics?<p>{s.current_metrics}</p>:null}{s.usage?<p className="knowledge-note">{s.usage}</p>:null}</article>)}
      </details>
      <details><summary>Application answers</summary>
        <label className="knowledge-language">Language<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="pt-BR">Português</option><option value="en">English</option></select></label>
        <h4>Cover letter</h4><p className="knowledge-template">{knowledge.writing.cover_letter[language]}</p>
      </details>
      <p className="knowledge-note knowledge-footer">Updated {new Date(knowledge.updated_at).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})} · <a href="https://github.com/metrix0/carreer-system/blob/main/AGENTS.md" target="_blank" rel="noreferrer">Operating rules ↗</a></p>
    </div>:null}
  </Dialog>;
}
