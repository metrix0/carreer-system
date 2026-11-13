export const stages = ['discovered','subscribed','screening','interview','offer','hired'] as const;
export type Stage = typeof stages[number];
export const stageLabels: Record<Stage,string> = {discovered:'Discovered',subscribed:'Subscribed',screening:'Passed / screening',interview:'Interview',offer:'Offer',hired:'Hired'};
export type Application = {id:string; source_key:string; company:string; position:string; stage:Stage; outcome:'active'|'rejected'|'closed'|'excluded'; score:number; salary:string; remote:string; eligibility:string; deadline:string|null; source_url:string; next_action:string; responsible:string; submitted_at:string|null; submission_verified:boolean; confirmation:string; notes:string; source_status:string; created_at:string; updated_at:string; submission_details?:unknown};
export type Task = {id:string; application_id:string|null; title:string; status:'blocked'|'pending'|'completed'; last_stage:Stage|null; responsible:string; deadline:string|null; url:string; notes:string; created_at:string; completed_at:string|null; gmail_thread_id?:string|null};
export type StageEvent = {id:string; application_id:string; from_stage:Stage|null; to_stage:Stage; event_type:string; evidence:string; created_at:string};
export const rank = (s:Stage|null) => s===null ? -1 : stages.indexOf(s);
export function sortTasks(tasks:Task[]) { return [...tasks].sort((a,b)=> rank(b.last_stage)-rank(a.last_stage) || (a.deadline||'9999').localeCompare(b.deadline||'9999') || a.created_at.localeCompare(b.created_at)); }
export function weekBounds(now=new Date()) {
 const day = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const start = new Date(`${day}T00:00:00-03:00`); const weekday=(start.getUTCDay()+6)%7;
 start.setUTCDate(start.getUTCDate()-weekday);
 return {start:start.toISOString(),end:new Date(+start+7*86400000).toISOString(),previous:new Date(+start-7*86400000).toISOString()};
}
export function metrics(apps:Application[],tasks:Task[],now=new Date()) {
 const w=weekBounds(now); const verified=apps.filter(a=>a.submission_verified&&a.submitted_at);
 const count=(from:string,to:string)=>verified.filter(a=>a.submitted_at!>=from&&a.submitted_at!<to).length;
 const interviews=apps.filter(a=>a.outcome==='active'&&rank(a.stage)>=rank('interview')).length;
 const converted=verified.filter(a=>rank(a.stage)>=rank('interview')).length;
 return {thisWeek:count(w.start,w.end),lastWeek:count(w.previous,w.start),active:apps.filter(a=>a.outcome==='active'&&a.stage!=='discovered').length,interviews,actions:tasks.filter(t=>t.status!=='completed').length,conversion:verified.length?Math.round(converted/verified.length*100):0,verified:verified.length,unknownDates:apps.filter(a=>a.submission_verified&&!a.submitted_at).length};
}
export function safeUrl(url:string) {try {const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:undefined;}catch{return undefined;}}
export function dateLabel(value:string|null){return value?new Date(value.length===10?value+'T12:00:00-03:00':value).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'America/Sao_Paulo'}):'No deadline';}

// Legacy imports sometimes assign both candidate and agent. Only an explicit
// personal step belongs in the candidate queue; technical retries stay with AI.
export function taskOwner(task: Pick<Task,'responsible'|'title'>): 'human'|'ai' {
 const owner=task.responsible.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
 const candidate=/candidate|candidato|human|joao|^j$|^you$/.test(owner);
 const agent=/agent|agente|\bai\b|work mode/.test(owner);
 if(!candidate)return 'ai';
 if(!agent)return 'human';
 const title=task.title.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
 return /desafio humano|verificacao humana/.test(title) || /completar hcaptcha|captcha manual|intervencao manual|gpa|ira\/|ira,|cefr|proficiencia|pcd|parentesco|cnpj|nomes completos dos pais|candidato verificar|candidato confirmar/.test(title) ? 'human':'ai';
}
