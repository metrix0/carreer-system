import {readFileSync,writeFileSync} from 'node:fs';
import {normalizeTracker,type Tracker} from '../lib/import';
const input=process.argv[2],output=process.argv[3];
if(!input||!output)throw new Error('Usage: node --import tsx scripts/prepare-import.ts /private/tracker.json /private/import.sql');
const data=JSON.parse(readFileSync(input,'utf8')) as Tracker;
const normalized=normalizeTracker(data);
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
const apps=quote(JSON.stringify(normalized.applications));
const tasks=quote(JSON.stringify(normalized.tasks));
const sql=`begin;
insert into private.import_snapshots(source,records) values('Career Radar Google Sheets',${quote(JSON.stringify(data))}::jsonb);
insert into public.applications(source_key,company,position,score,stage,outcome,salary,remote,eligibility,deadline,source_url,next_action,responsible,submitted_at,submission_verified,confirmation,notes,source_status,source_data)
select source_key,company,position,score,stage::public.recruitment_stage,outcome,salary,remote,eligibility,deadline,source_url,next_action,responsible,submitted_at,submission_verified,confirmation,notes,source_status,source_data from jsonb_to_recordset(${apps}::jsonb) as x(source_key text,company text,position text,score integer,stage text,outcome text,salary text,remote text,eligibility text,deadline date,source_url text,next_action text,responsible text,submitted_at timestamptz,submission_verified boolean,confirmation text,notes text,source_status text,source_data jsonb)
on conflict(source_key) do nothing;
insert into public.tasks(application_id,title,status,last_stage,responsible,deadline,url,notes)
select a.id,x.title,x.status,x.last_stage::public.recruitment_stage,x.responsible,x.deadline,x.url,x.notes from jsonb_to_recordset(${tasks}::jsonb) as x(source_key text,title text,status text,last_stage text,responsible text,deadline date,url text,notes text) join public.applications a on a.source_key=x.source_key where not exists(select 1 from public.tasks t where t.application_id=a.id and t.title=x.title);
commit;`;
writeFileSync(output,sql);writeFileSync(output+'.summary.json',JSON.stringify(normalized));
console.log(JSON.stringify({applications:normalized.applications.length,tasks:normalized.tasks.length,verified:normalized.applications.filter(a=>a.submission_verified).length,merged: data.opportunities.length-1-new Set(Object.values(normalized.aliases)).size}));
