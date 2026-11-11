// Import the tracker without promoting email-sent, drafts, assessments, or closed roles to interviews.
export type Tracker={opportunities:string[][];processes:string[][];discarded:string[][];rules:string[][]};
const clean=(s:string='')=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function parseDate(s:string=''):string|null{
 const iso=s.match(/\b(2026-\d{2}-\d{2})\b/);if(iso)return iso[1];
 const br=s.match(/\b(\d{2})\/(\d{2})\/(2026)\b/);if(br)return `${br[3]}-${br[2]}-${br[1]}`;
 const short=s.match(/\b(\d{2})\/(\d{2})(?!\/\d)/);if(short)return `2026-${short[2]}-${short[1]}`;
 return null;
}
export function normalizeTracker(data:Tracker){
 const applications:Record<string,unknown>[]=[],tasks:Record<string,unknown>[]=[],aliases=new Map<string,string>(),identity=new Map<string,string>();
 const opps=data.opportunities.slice(1).filter(r=>r[0]&&r[1]);
 for(const row of opps){const ats=(row[9]||'').match(/https?:\/\/([^/]+\.gupy\.io)\/jobs\/(\d+)/);const key=ats?ats[1]+'/'+ats[2]:row[0];const existing=identity.get(key);if(existing){aliases.set(row[0],existing);continue;}identity.set(key,row[0]);aliases.set(row[0],row[0]);}
 const matched=new Set<number>();
 for(const row of opps){if(aliases.get(row[0])!==row[0])continue;
 const source_key=row[0], related=data.processes.slice(1).map((p,i)=>({p,i})).filter(({p})=>{const ids=(p[17]||'').split(/[;,]/).map(s=>s.trim());return ids.some(id=>aliases.get(id)===source_key)||((row[9]||'').includes('.gupy.io/jobs/')&&(p[11]||'').split('?')[0]===row[9].split('?')[0]);});
 for(const {i} of related)matched.add(i);
 const status=row[10]||'', action=row[11]||'', base=clean(status),verify=clean(row[4]),processStatus=related.map(({p})=>p[3]||'').join('\n');
 const current=clean(processStatus);const primary=[base,clean(action).split(' — ')[0],...related.map(({p})=>clean(p[3]))];
 let outcome='active';
 if(primary.some(s=>/^(rejeitad|nao passou|nao selecionad|reprovad|gupy comunicou nao selecao|rejeicao explicita)/.test(s)))outcome='rejected';
 else if(/^(nao elegivel|inelegivel)/.test(verify)||/^inelegivel/.test(current)||/excluida por modelo hibrido/.test(base))outcome='excluded';
 else if(primary.some(s=>/^(encerrad|processo encerrad|processo finalizad|vaga (encerrada|preenchida|cancelada))/.test(s))||/^(encerrad|link invalido)/.test(verify)||/^excluida/.test(base)||/^nao enviada.*(vaga encerrada|vaga preenchida)/.test(base))outcome='closed';
 // A statement of sending email is not an employer receipt.
 const noSubmission=/^(nao enviada|nao verificada|bloqueada|rascunho|falha|em andamento|nao tentada)/.test(base);
 const evidenceText=[status,row[13]||'',row[16]||''].join('\n');
 const confirmed=!noSubmission&&/candidatura finalizada|candidatura enviada!|inscricao feita com sucesso|form was submitted successfully|sua resposta foi registrada|recebemos sua candidatura|submetida e confirmada|enviada e confirmada|confirmacao yc recebida|banco de talentos.*confirmad|inscricao \d+ anteriormente confirmada|candidatura enviada em/.test(clean(evidenceText));
 const confirmedProcess=related.find(({p})=>/candidatura (submetida e confirmada|confirmada no ats|finalizada e confirmada)|registro confirmado no banco|recebimento automatico/.test(clean(p[3])));
 const verified=confirmed||(!noSubmission&&!!confirmedProcess);
 let stage='discovered';if(verified)stage='subscribed';
 const activeProcess=related.find(({p})=>/^pendente/.test(clean(p[9])));
 if(verified&&activeProcess&&/teste|logica|sql|fit cultural|questionario|mindsight|digai/.test(clean(activeProcess.p[8]||'')))stage='screening';
 if(verified&&source_key==='CR-20261030-IFOOD-GENAI-AIENG')stage='screening';
 let submissionDay:string|null=null;
 if(verified){
  if(/^(enviada|submetida|enviado|banco de talentos)/.test(base))submissionDay=parseDate(status);
  if(!submissionDay){const dated=evidenceText.match(/(?:candidatura enviada (?:em )?|candidatura submetida (?:em )?)(\d{2}\/\d{2}(?:\/2026)?|2026-\d{2}-\d{2})/i);if(dated)submissionDay=parseDate(dated[1]);}
 }
 const responsible=activeProcess?.p[13]||related.find(({p})=>p[13])?.p[13]||'Agent';
 const duplicateRows=opps.filter(r=>aliases.get(r[0])===source_key);
 applications.push({source_key,company:row[1],position:row[2],score:Math.min(100,Math.max(0,parseInt(row[3])||0)),stage,outcome,salary:row[6]||'UNKNOWN',remote:row[5]||'Unverified',eligibility:row[7]||'',deadline:parseDate(row[8]),source_url:row[9]||'',next_action:activeProcess?.p[7]||related.find(({p})=>p[7])?.p[7]||action,responsible,submitted_at:submissionDay?submissionDay+'T12:00:00-03:00':null,submission_verified:verified,confirmation:verified?[status,confirmedProcess?.p[15]||'',row[16]||''].filter(Boolean).join('\n'):'',notes:row[13]||'',source_status:[status,processStatus].filter(Boolean).join('\n'),source_data:{opportunity_rows:duplicateRows,process_rows:related.map(x=>x.p)}});
 if(outcome!=='active')continue;
 const processPending=related.filter(({p})=>/^pendente|bloquead/.test(clean(p[9])));
 if(processPending.length&&verified){for(const {p} of processPending){const candidate=/candidato|participacao|pessoal|tecnico|logica\/sql/.test(clean([p[12],p[13]].join(' ')));tasks.push({source_key,title:p[7]||p[8]||'Review next stage',status:candidate?'blocked':'pending',last_stage:stage,responsible:p[13]||'Agent',deadline:parseDate(p[10]),url:p[11]||row[9]||'',notes:p[12]||''});}}
 else if(!verified){const blocked=/bloquead|captcha|cpf obrigatorio|exige gpa|exige respostas pessoais|cnpj/.test(clean([status,row[17]||''].join(' ')));tasks.push({source_key,title:action||'Verify eligibility, application status and next action',status:blocked?'blocked':'pending',last_stage:'discovered',responsible:blocked?'Candidate / Agent':'Agent',deadline:parseDate(row[8]),url:row[9]||'',notes:row[17]||''});}
 }
 // Preserve process-only records as unverified discoveries; historical reminders aren't proof of a current application.
 data.processes.slice(1).forEach((p,i)=>{if(matched.has(i)||!p[0])return;const key='process-row-'+(i+2);const text=clean(p[3]||'');const rejected=/^(rejeitad|nao passou|nao selecionad)/.test(text);const closed=/^(processo encerrad|encerrad|vaga (preenchida|cancelada|encerrada))/.test(text);applications.push({source_key:key,company:p[0],position:p[1]||'Historical process',score:0,stage:'discovered',outcome:rejected?'rejected':closed?'closed':'active',salary:'UNKNOWN',remote:'Unverified — historical process',eligibility:'Reconcile historical process with current opportunity',deadline:parseDate(p[10]),source_url:p[11]||'',next_action:p[7]||'Reconcile historical process',responsible:p[13]||'Agent',submitted_at:null,submission_verified:false,confirmation:'',notes:p[4]||'',source_status:p[3]||'',source_data:{process_rows:[p]}});if(!rejected&&!closed)tasks.push({source_key:key,title:p[7]||'Reconcile historical process',status:'pending',last_stage:'discovered',responsible:'Agent',deadline:null,url:p[11]||'',notes:'Historical process retained without assuming submission or interview.'});});
 return {applications,tasks,aliases:Object.fromEntries(aliases)};
}
