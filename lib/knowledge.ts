export type KnowledgeValue = string | number | boolean | null | KnowledgeValue[] | {[key:string]:KnowledgeValue};
export interface CandidateKnowledge {
 updated_at:string;
 knowledge:Record<string,KnowledgeValue>;
 identity:Record<string,KnowledgeValue>;
 identity_updated_at:string|null;
}
export const demoKnowledge:CandidateKnowledge={updated_at:'2026-11-01T12:00:00Z',identity_updated_at:null,identity:{},knowledge:{candidate:'Alex Example',education:{course:'Computer Science',status:'In progress',graduation_year:2027},contact:{portfolio:'https://example.com'},employment_history:[{company:'Example Studio',role:'Developer',period:'2024–present'}],skills:{languages:['TypeScript','Python']},availability:{immediate:true,hours_per_week:40},compensation:{minimum_brl_monthly:2000},declarations:{active_cnpj:false},application_writing:{cover_letter:{en:'Hi [company] hiring team,\n\nI am applying for [role].','pt-BR':'Olá, equipe da [empresa],\n\nQuero me candidatar à vaga de [cargo].'}}}};
export function knowledgeLabel(key:string){return ({'pt-BR':'Português',en:'English',cpf:'CPF',rg:'RG',application_writing:'Application answers',document_title:'Document title'} as Record<string,string>)[key]||key.replaceAll('_',' ').replace(/^./,s=>s.toUpperCase());}
