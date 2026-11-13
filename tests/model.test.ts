import {test} from 'node:test';
import assert from 'node:assert/strict';
import {metrics,sortTasks,weekBounds,safeUrl,type Application,type Task} from '../lib/model';
import {demoData} from '../lib/demo';
import {readSubmissionDetails} from '../lib/submission-details';

test('submission history displays both answer groups and keeps attachments and salary as ordinary answers', () => {
 const custom = {question: 'Technology', answer: 'React'};
 const other = [
  {question: 'CV attached', answer: 'CVbr.pdf'},
  {question: 'Pretensão salarial', answer: 'R$ 4.000'},
  {question: 'Tem disponibilidade imediata?', answer: 'Sim'},
 ];
 assert.deepEqual(readSubmissionDetails({
  custom_answers: [custom, {question: 'E-mail', answer: 'contact@example.org'}],
  other_answers: [...other, {question: 'Data de nascimento', answer: '01/01/2000'}],
  cv_version: 'old.pdf',
 }), {customAnswers: [custom], otherAnswers: other});
});

test('submission history preserves recorded legacy fields without adding empty answers', () => {
 assert.deepEqual(readSubmissionDetails({cv_version: 'CVbr.pdf (link enviado)', salary_expectation: ' '}), {
  customAnswers: [],
  otherAnswers: [{question: 'CV', answer: 'CVbr.pdf (link enviado)'}],
 });
 assert.deepEqual(readSubmissionDetails({salary_expectation: 'R$ 4.000'}), {
  customAnswers: [],
  otherAnswers: [{question: 'Salary expectation', answer: 'R$ 4.000'}],
 });
 assert.equal(readSubmissionDetails({custom_answers: [], other_answers: []}), null);
});

test('week starts Monday at midnight in Sao Paulo, including UTC boundary',()=>{
 assert.equal(weekBounds(new Date('2026-11-09T02:59:59Z')).start,'2026-11-02T03:00:00.000Z');
 assert.equal(weekBounds(new Date('2026-11-09T03:00:00Z')).start,'2026-11-09T03:00:00.000Z');
});
test('weekly KPI excludes undated and unconfirmed submissions and counts archived submissions',()=>{
 const base=demoData().apps[0];const apps=[{...base,submitted_at:'2026-11-09T03:00:00Z',outcome:'rejected'},{...base,id:'two',submitted_at:'2026-11-09T02:59:59Z'},{...base,id:'three',submitted_at:null},{...base,id:'four',submission_verified:false,submitted_at:'2026-11-10T15:00:00Z'}] as Application[];
 const m=metrics(apps,[],new Date('2026-11-11T15:00:00Z'));assert.equal(m.thisWeek,1);assert.equal(m.lastWeek,1);assert.equal(m.unknownDates,1);
});
test('actions rank proximity before deadlines, preserve source stages',()=>{
 const base=demoData().tasks[0];const tasks=[{...base,id:'a',last_stage:'discovered',deadline:'2026-01-01'},{...base,id:'b',last_stage:'interview',deadline:'2026-12-01'},{...base,id:'c',last_stage:'screening',deadline:null},{...base,id:'d',last_stage:'screening',deadline:'2026-11-11'}] as Task[];
 assert.deepEqual(sortTasks(tasks).map(t=>t.id),['b','d','c','a']);assert.equal(tasks[0].id,'a');
});
test('unsafe and malformed links cannot become executable URLs',()=>{assert.equal(safeUrl('javascript:alert(1)'),undefined);assert.equal(safeUrl('not a url'),undefined);assert.equal(safeUrl('https://example.com/apply'),'https://example.com/apply');});
import {normalizeTracker} from '../lib/import';
test('import does not mistake automated assessment invitations or sent emails for interviews or receipts',()=>{
 const rows=[['ID','Company'],['one','Example','Engineer','90','APTA','Remoto','UNKNOWN','','','https://example.com','E-MAIL ENVIADO — Gmail SENT; sem confirmação RH','Aguardar RH'],['two','Other','Intern','90','APTA','Remoto','UNKNOWN','','','https://example.net',"SUBMETIDA E CONFIRMADA 03/11/2026 — 'Sua resposta foi registrada.'",'Aguardar RH']];
 const data=normalizeTracker({opportunities:rows,processes:[[],['Example','Engineer','','E-MAIL ENVIADO','','','','','Entrevista automatizada Digaí','AGUARDANDO RH','','','','','','','','one']],discarded:[],rules:[]});
 assert.equal(data.applications[0].submission_verified,false);assert.equal(data.applications[0].stage,'discovered');assert.equal(data.applications[1].stage,'subscribed');assert.equal(data.applications[1].submitted_at,'2026-11-03T12:00:00-03:00');
});
test('import merges repeated Gupy requisitions and retains source rows',()=>{
 const row=['one','Example','Engineer','90','APTA','Remoto','UNKNOWN','','','https://example.gupy.io/jobs/123',"ENVIADA — Gupy 'Candidatura finalizada!' 2026-10-17"];
 const result=normalizeTracker({opportunities:[[],row,['two',...row.slice(1)]],processes:[],discarded:[],rules:[]});assert.equal(result.applications.length,1);assert.equal(result.aliases.two,'one');
});

import {taskOwner} from '../lib/model';
test('action owner separates personal steps from AI retries in legacy shared assignments',()=>{
 const shared={responsible:'Candidate / Agent'};
 assert.equal(taskOwner({...shared,title:'Confirmar IRA/GPA e inglês CEFR'}),'human');
 assert.equal(taskOwner({...shared,title:'Candidato confirmar CNPJ ativo'}),'human');
 assert.equal(taskOwner({...shared,title:'Completar hCaptcha manualmente no navegador'}),'human');
 assert.equal(taskOwner({...shared,title:'Encontrar abertura oficial atual e confirmar remoto integral.'}),'ai');
 assert.equal(taskOwner({...shared,title:'Investigar validação final/recaptcha e executar envio'}),'ai');
 assert.equal(taskOwner({responsible:'Candidate',title:'Choose interview time'}),'human');
 assert.equal(taskOwner({responsible:'Agente — inspecionar e completar se permitido',title:'Revisar próxima etapa'}),'ai');
 const sorted=sortTasks(demoData().tasks);
 assert.deepEqual(sorted.filter(t=>taskOwner(t)==='human').map(t=>t.id),['task1','task2','demo-email']);
 assert.deepEqual(sorted.filter(t=>taskOwner(t)==='ai').map(t=>t.id),['task3']);
});
