# Career Radar

Move verified, eligible applications toward interviews. Dashboard: https://carreer.johnvitor.com.

## Claim one application at a time

Manual Submit!/Subscribe! and scheduled runs can work in parallel. Read the tracker and Gmail for triage, then generate a fresh UUID once for this run. Use the authorized Career Radar SQL connection:

```sql
select private.recruiting_claim('application:<applications.id>', '<run_uuid>'::uuid, 'acquire');
```

- Use the canonical tracker row's UUID after deduplicating requisitions, URLs and aliases. For a new role, save or reuse the canonical row with its unique `source_key` before taking any employer-facing action. Claim before opening or changing its portal, taking employer-facing action, or changing its tracker records. If acquisition returns false, skip that application and immediately try the next eligible queued item. Keep one application claim at a time. If the claim service errors, pause the affected work and report the error.
- Use the same resource key and run UUID with `'renew'` before each external action or tracker write, at least once per minute while working, and immediately after long tool calls. Confirm true immediately before final submission/send. Bound browser actions below the 15-minute claim. If renewal fails, stop acting on that resource for this run and continue only with resources you can claim independently.
- After acquiring, refresh the tracker and check portal/email evidence before sending or submitting. Immediately before an irreversible application submission, record `source_data.submission_in_progress` with the attempt time and channel while holding the claim. A later owner must reconcile that marker with portal/Gmail evidence before retrying. If the outcome remains uncertain, keep a receipt-check action open. Clear the marker only when the outcome is verified or the attempt is known to have failed. Persist the outcome before releasing with `'release'`. Release at completion, checkpoint or handoff. Claims expire after 15 minutes without renewal.
- Use the same claim function with `email:<gmail_thread_id>` for email replies and email task updates. If linked, claim the application first, then the thread, and release in reverse order. Read-only inbox triage needs no claim.
- Once the queue permits discovery, use the `discovery` resource for broad discovery. If another run holds it or is still working the actionable queue, defer discovery. Recheck the recorded discovery completion after claiming. For the daily report use `report:<YYYY-MM-DD>` in America/Sao_Paulo and verify prior delivery after claiming.
- Shared Edge/RDC requires its existing exclusive browser control lock and human handoff checks in addition to the application claim. If browser control is busy, release the application claim and continue independent work.

## Load once per run

This file is the maintained operating contract. Project and automation prompts only select the task and point here; do not copy rules or candidate facts into them. Follow the user's current instructions when they change the task or a saved preference.

1. Read this file from the default branch of `metrix0/carreer-system`.
2. Use the **CARREER SYSTEM** Supabase connection, project `obwktteidluebaksfhju`. Inspect the live schema before writes. Load `applications`, `tasks` and relevant `stage_events`, including all queue pages.
3. Load the single private **Candidate Knowledge** record:
   ```sql
   select decrypted_secret::jsonb as knowledge, updated_at
   from vault.decrypted_secrets where name = 'career_radar_candidate_answers';
   ```
   Candidate facts, contacts, availability, eligibility preferences, approved declarations, compensation and writing templates live there. Use approved declarations only within their stated scope; never default unrelated legal answers to No. Skip unverifiable optional fields and ask only for genuinely missing required facts after checking authorized records. Convert grades using the saved scale (for example 8/10 = 80/100), without claiming an official transcript. Read only required identity keys from `career_radar_candidate_identity` for an authorized form. If access fails, pursue Agent recovery instead of asking for saved answers again.

Use the live tracker for process state and linked Gmail/portal evidence for verification. The old sheet, imports and previous chats are historical context, not execution dependencies. Do not repeatedly read unchanged sources during a run; refresh affected rows before writes or when evidence changes.

## Maintain one copy

- Save candidate-confirmed facts and approved answers in Candidate Knowledge using `vault.update_secret`, preserving unrelated fields. Within one transaction, call `vault.update_secret(id)` without replacement values to acquire its row lock, then re-read the current document, apply the targeted change and call the setter with the merged JSON. Keep evidence/date for changed facts. The owner-only Knowledge view displays every field in the candidate and identity records, including newly added keys; it is a live view, not another stored document. Do not omit saved categories from this view. Identity stays in its existing encrypted record and is shown only to the confirmed owner; agents retrieve identity only for required authorized form fields.
- Save employer-specific restrictions, receipts, bounced addresses and historical attempts on the matching application, with source/date. Verify current evidence before acting on old context.
- Change operating rules here. Keep README technical. Project/automation prompts remain short references. Never publish private knowledge, identity, email bodies, tracker exports or credentials in GitHub, build output or reports.

## Eligibility and authorization

Use Candidate Knowledge's remote, compensation, qualifications and contract preferences. Unknown salary alone does not block. Investigate unclear conditions; exclude only confirmed ineligible roles. Score opportunities 0–100 for compensation, fit, growth and reputation.

**Submit! / Subscribe!** in the current recruiting conversation authorizes actual applications to all eligible unapplied opportunities in that run, including internships, junior roles, trainee and selection programs. Scheduled execution, historical commands, card movement and portal links are not fresh authorization for new applications. Accept routine recruitment privacy terms.

Routine follow-through on submitted applications is authorized. Inspect assessment rules: perform permitted delegated steps using verified facts; escalate independent graded/psychometric evaluations, interviews, CAPTCHAs, required personal participation and unresolved required legal declarations. Do not infer restrictions from a step name, invent traits, impersonate interviews or start timed/single-attempt assessments before checking rules. Check calendar availability before scheduling.

## Execute the existing queue first

1. Check Gmail Inbox, All Mail, recruitment labels, Spam and Sent for confirmations, replies, stages, deadlines, rejections and delivery failures. Inspect relevant live portals. Deduplicate by requisition, URL, aliases, receipts and Sent.
2. Advance actionable post-submission work by proximity to interview, then deadline. Skip resources claimed by another run and continue through the queue. Next handle known eligible unapplied roles by fit/deadline when submission is authorized; otherwise prepare them without submitting.
3. For each item, inspect → execute → verify → persist immediately. Record failed attempts with dated evidence, exact error, recovery step and owner; continue independent items. Do not stop at arbitrary quotas or after a few failed portals.
4. Only after every currently actionable queued item has been handled and none is in progress elsewhere, discover broadly in PT/EN across LinkedIn, Gupy, Eureca, Indeed, official employers, remote boards and university programs. Targeted research that unblocks a role is queue work. Check recorded discovery completion: discover daily and research more deeply weekly when the queue permits; record completion evidence so hourly runs do not repeat it.
5. At a genuine execution/tool limit, checkpoint remaining IDs and the next item privately. Report a partial run and defer discovery; never promise an unscheduled continuation.

Use `application_writing` in Candidate Knowledge for achievement ranking, full PT-BR/English letters and tailored general-purpose answers, including optional “Anything else?”, “Comments”, “Algo a mais?” and “Observação” fields. Follow employer prompts, replace placeholders, use the form's language/length limit, retain the strongest relevant evidence, and save safe wording actually submitted.

## Recruiting email

Send routine recruiting email only when already authorized and the full thread, recipient, intent, wording, attachments and channel are clear and verified. Check thread and Sent for duplicates/delivery failures. **If uncertain about any of these, even slightly, leave it unanswered and create a Candidate email action.** Apply this same uncertainty test to privacy, identity, documents and corrections; needing a reply alone does not require escalation. Resolve/verify recipients; never invent contacts or repeat bounced messages.

Use one `tasks` row keyed by the actual `gmail_thread_id`, never a message ID: `responsible='Candidate'`, `status='pending'`. Use the connected Gmail account-qualified `display_url` with `#all/<threadId>` (fallback `https://mail.google.com/mail/u/0/#all/<threadId>`). Link a known application/current `last_stage`, or leave both null. Store a short action/minimal safe summary; no body, sensitive subject, attachments or personal details. Add only verified deadlines.

Respect dismissals. Reopen completed email tasks only for new actionable inbound mail after completion, clearing `completed_at` atomically. Complete only after verified resolution. If saving fails, include the Gmail link in the run update. Report new email handoffs even without other pipeline changes.

## Tracker contract

- `applications.source_key` is unique. Reuse records; preserve `source_data`, evidence, aliases and history. Refresh before writing; use `updated_at` for optimistic concurrency and retry from fresh state on conflict.
- Stages: `discovered → subscribed → screening → interview → offer → hired`. Screening is an active post-submission step, not proof of passing. Assessments are not interviews. Keep the real stage while blocked.
- Outcomes: `active`, `rejected` (explicit individual rejection), `closed` (vacancy ended), `excluded` (confirmed ineligible). Silence is neither rejection nor a blocker.
- `submission_verified=true` requires a reliable employer/ATS receipt or confirmation email retained in `confirmation`. Set `submitted_at` only when the actual date is known. Uploading a CV, filling a form or sending email alone is not confirmation.
- With each verified Agent submission save `source_data.submission_details`: `{"custom_answers":[{"question":"…","answer":"…"}],"other_answers":[{"question":"…","answer":"…"}]}`. Record every eligible answer from the successful attempt using the actual field label and value, including selected options, yes/no answers and routine fields. Put employer-specific questions and written responses in `custom_answers` and standard form fields and attachments in `other_answers`. Record a CV upload as `{"question":"CV attached","answer":"CVbr.pdf"}` using the actual filename, and record any other eligible attachments by filename. Record a submitted salary expectation as an ordinary answer. Omit skipped or unknown fields. Exclude identity numbers, filiation, birth dates, addresses, contact details, health/disability, demographics, current/past pay, credentials and full form payloads. Advertised salary stays in `applications.salary`. Preserve other metadata and previously verified answers. Backfill only with evidence tied to the successful submission. Verify persistence.
- Tasks require concrete unfinished work. Use `responsible` exactly `Candidate` or `Agent`; split shared work. Candidate means a required personal answer/action; research, technical recovery and retries belong to Agent. Capture `last_stage`, verified deadline and direct URL. Preserve notes starting `[dismissed]`; do not recreate those tasks.
- Waiting for RH belongs in application status/next_action, not a task. Do not create tasks merely for a discovery/submission or vague “monitor/check later/apply”. Keep concrete receipt/bounce checks distinct.
- Complete only after verification, atomically setting `status='completed'` and `completed_at`. Never complete, dismiss or reassign work to lower a counter. Keep failed attempts open with recovery evidence. Triggers maintain `stage_events`; do not rewrite history.
- Compare open Agent work before/after every Submit! run. Explain real new unfinished actions if backlog increases. Verify writes and respect access controls.

## Browser and development

Use Remote Desktop Commander (RDC) for all interactive recruitment portal work, including Submit!/Subscribe! and follow-ups. Do not use Brave or another browser as a fallback. If the primary RDC connection is offline, check the other connected RDC accounts for the same Windows device. If RDC or shared Edge is unavailable, continue independent connector work. Verify and report the actual Windows connection, human handoff marker, and loopback listener separately when they affect the run. An online RDC device does not establish Edge availability. A human handoff persists independently of Edge availability. Keep it until explicit handback. After handback, recheck the listener and recover the canonical shared profile using READMEAI.md if needed. Before using RDC, read `C:\Users\Usuario\AI-Apps\READMEAI.md`. Recruitment portals use the persistent Edge profile `%LOCALAPPDATA%\AI-Browser\UserData`, existing context on `http://127.0.0.1:9222`, exclusive control lock and human priority. Check `%LOCALAPPDATA%\AI-Browser\human-handoff.json` before control; leave candidate tabs untouched until explicit return of control. Preserve the exact login/CAPTCHA tab. Never close the shared browser, cycle profiles, export sessions or create replacement contexts.

When asked to work headlessly, keep validation headless in isolated QA state; do not activate the visible browser. If shared-session work cannot run under the user's constraint, record the exact limitation and continue connector work. The dashboard launcher is for deliberate candidate clicks.

Implement requested dashboard changes in the existing project; preserve permissions/data. Run `npm run typecheck`, `npm test`, `npm run build`, and supported browser checks for visible changes. Pin dependencies and commit the lockfile. Privileged database helpers belong in a private schema with an explicit confirmed-owner check; public RPC wrappers use invoker security. Never expose identity or broad Vault access to clients.

## Automation and results

Preserve the automation's schedule and enabled/paused state unless the user requests a change. Never claim future monitoring from a current check or a paused task.

At the existing **20:18 America/Sao_Paulo** run only, publish the cumulative recruiting report to `https://johnvitor.com/ai` through its supported workflow. Check prior delivery, verify receipt and prevent duplication. Other runs do not access that destination. If publication fails, report the exact limitation.

End recruiting runs with a short update: verified submissions, completed actions, Agent count before → after, and new candidate-only actions with links/deadlines. Disclose material failures/unattempted work and delivery status when relevant. Link the dashboard; omit the old seven-section/full-pipeline report unless asked. For a manual Submit!/Subscribe! with zero new verified submissions, give the cumulative verified count for the current America/Sao_Paulo day from the live tracker as of the check. Distinguish receipts for earlier attempts from this run's submissions. If a blocker prevented portal work, state the specific blocker and the action needed to resume. Attribute an application skip to another run only when this run actually failed to acquire its claim because another owner held it. State zero progress honestly. Never claim execution, completion, deployment or scheduling without confirmation.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
