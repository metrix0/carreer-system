export interface CandidateKnowledge {
  updated_at: string;
  candidate: string;
  education: { course: string; university: string; status: string; graduation_year: number | null };
  background: { en?: string; pt_br?: string };
  preferences: { remote: string; hours_per_week: number | null; immediate: boolean; contracts: string[]; minimum_brl_monthly: number; desired_brl_monthly: number[] };
  writing: { guidance: string; strengths: { key: string; claim: string; usage?: string; current_metrics?: string }[]; cover_letter: Record<string,string>; short_answer: Record<string,string> };
}

// Synthetic preview only. Live knowledge is loaded on demand from the protected RPC.
export const demoKnowledge: CandidateKnowledge = {
  updated_at: '2026-11-01T12:00:00Z', candidate: 'Alex Example',
  education: { course: 'Computer Science', university: 'Example University', status: 'In progress', graduation_year: 2027 },
  background: { en: 'Building web applications and integrations.', pt_br: 'Desenvolvimento de aplicações web e integrações.' },
  preferences: { remote: '100% remote', hours_per_week: 40, immediate: true, contracts: ['Internship', 'Full-time'], minimum_brl_monthly: 2000, desired_brl_monthly: [3000,4000] },
  writing: { guidance: 'Choose relevant, verified achievements for each role.', strengths: [{ key: 'example', claim: 'Built a production web application.' }], cover_letter: { en: 'Hi [company] hiring team,\n\nI am applying for [role]. [Connect a responsibility to verified experience.]', 'pt-BR': 'Olá, equipe da [empresa],\n\nQuero me candidatar à vaga de [cargo]. [Relacione uma responsabilidade à experiência comprovada.]' }, short_answer: { en: 'I build web applications and integrations.', 'pt-BR': 'Desenvolvo aplicações web e integrações.' } },
};
