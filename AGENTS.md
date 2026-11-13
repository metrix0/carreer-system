# Career Radar implementation and operations

Keep the product to one focused dashboard. Preserve data and stage history. Never ship private tracker exports, email text, credentials, or personal declarations in public GitHub source or client build output.

## Source of truth

The dashboard reads Supabase project `obwktteidluebaksfhju`. Read the current schema before writes. Use the CARREER SYSTEM Supabase connection; never another project's connection. Keep the legacy tracker as a backup during cutover. Do not pause, replace or claim to have migrated background execution unless its replacement is verified.

## Worker / agent writes

- `applications.source_key` is unique. Reuse existing keys; deduplicate by employer requisition and URL before inserting. Read `source_data` and existing history when reconciling imported aliases.
- Stage values: `discovered`, `subscribed`, `screening`, `interview`, `offer`, `hired`. `screening` means an active post-submission step, not necessarily a completed or passed assessment. Do not infer interviews from an automated assessment invitation.
- `outcome`: `active`, `rejected` (explicit individual rejection), `closed` (vacancy ended), `excluded` (confirmed ineligible).
- Set `submission_verified=true` only with reliable employer or platform confirmation, put the actual receipt in `confirmation`, and only populate `submitted_at` when its actual date is known. Sent email or an uploaded CV alone is not receipt confirmation. Do not reapply to an email-sent process without checking for duplicates and delivery.
- For each verified Agent submission, save the actual CV filename/version, salary expectation entered (with currency and period if supplied), and non-sensitive custom question/answer pairs in `applications.source_data.submission_details`. Shape: `{"cv_version":"…","salary_expectation":"…","custom_answers":[{"question":"…","answer":"…"}]}`. Omit unknown or unused fields. Capture the answers from the successful attempt while they are available. Leave out CPF, RG, other identity numbers, filiation, date of birth, addresses, contact details, health/disability, demographic data, current/past pay, credentials and full form payloads. Preserve submitted wording where safe. Keep the advertised salary in `applications.salary`.
- Save this snapshot with submission verification in the same update when possible. Use `jsonb_set(source_data, '{submission_details}', <snapshot>::jsonb, true)` with the existing `updated_at` concurrency check. Preserve other source data and existing verified details when checking receipts later. Backfill only details explicitly tied to a verified submission.
- `tasks.status`: `pending`, `blocked`, `completed`. Blocked is a task state, not a Kanban stage. Capture `last_stage` from the application when creating a task. Include exact next action, responsible party, deadline and direct URL. Do not make waiting for recruiter responses a blocked task.
- To complete a task, update both `status='completed'` and `completed_at` atomically. Record stage completion only after verification.
- Application inserts and stage/outcome changes append `stage_events` automatically. Do not directly alter that history. Use `updated_at` as an optimistic-concurrency condition when updating records and refresh on conflict.
- Workers can use the authorized Supabase MCP connection or a server-only service credential. No service credentials belong in browser code, public files, shell arguments or logs.

## Private candidate profile

At the start of each recruiting run, load the standing answers from the authorized Career Radar Supabase connection. Use `SELECT decrypted_secret::jsonb FROM vault.decrypted_secrets WHERE name = 'career_radar_candidate_answers';` before filling forms or assigning candidate actions. Retrieve only required identity fields from the separate `career_radar_candidate_identity` record. Keep private values out of public source, the dashboard, task notes, prompts, and reports. If access fails, track technical recovery as Agent work. Only ask the candidate for a required answer that is missing from the profile and authorized records.

The user delegates cultural-fit steps and assessments when the portal or employer permits delegated assistance. Agent inspects the actual rules, completes permitted steps using verified profile information and approved preferences, and escalates only when an individual assessment or human interaction is required. A step name alone does not establish that requirement.

### Application answers and cover letters

Use `operating_rules.application_writing` from the private candidate profile. Pick one or two role-relevant strengths for professional introductions, motivation and experience answers. Fill optional professional fields when a verified, specific answer adds value.

Use the saved PT-BR or English cover-letter template in the posting's language. Provide it for required letter fields and for optional ones when a concrete role or company detail supports meaningful tailoring. Personalize the opening, select the strongest relevant evidence, replace every placeholder and respect the form's length limit. Use employer-facing metrics consistent with the CV being sent. Save the actual letter under `submission_details.custom_answers` when submitted and safe to retain.

## Authorization

New applications require the user's explicit Submit! / Subscribe!. Adding a record, moving a card or clicking an application URL does not authorize submitting to an employer. Approved routine follow-up stages are automatic. Escalate confirmed human-required assessments, CAPTCHAs, unresolved legal declarations and significant commitments. Use approved preferences for permitted assessment responses. Never fabricate personal facts, submission receipts or interview invitations.

## Recruitment run contract

For recruiting work, read the live Supabase applications, tasks and stage_events before acting. The spreadsheet is historical backup, not an execution dependency.

Submit! / Subscribe! authorizes actual applications to all eligible, unapplied opportunities in the current run.

Work the existing pipeline before searching for new opportunities. Inspect all pages of the live queue, skip completed and [dismissed] tasks, and respect concurrent updates. Handle actionable post-submission steps first, ordered by proximity to interview and deadline, then work known eligible unapplied roles by fit and deadline when the current run authorizes submission.

Start broad discovery only after every existing item that can advance in the current run has had its next step executed, verified and saved. A blocker with no available next step in this run can stay open with dated evidence, an owner and a specific recovery step. Continue with the other queued items. Targeted research to unblock an existing opportunity counts as queue work. If the run reaches a time or tool limit while actionable items remain unattempted, checkpoint the remaining work and defer discovery.

Scheduled runs use the same ordering for authorized follow-through, research and recovery. Keep applications that require a fresh Submit! ready in the tracker.

For each actionable item: inspect current evidence, perform the authorized next step, verify the result and persist it immediately. Complete tasks atomically with completed_at only after verified completion. An attempted but unsuccessful submission stays open with dated evidence, exact error, next recovery step and owner. Record attempts in task notes without erasing prior evidence. Re-read before writing and do not duplicate tasks.

## Agent-action backlog invariant

The `AI actions` count must measure concrete unfinished **Agent** work, not how many discoveries, submissions, or employers are merely awaiting a response.

- **Do not create an Agent task just because a job was discovered or an application was submitted.** Store discoveries in `applications`; store passive recruiter waiting and last receipt in `applications.next_action`, `source_status` and `notes`. Waiting alone is not an active task.
- Create tasks only for specific actionable research, technical recovery, or a currently due post-submission step that could not be finished in this run. Never create generic `monitor`, `follow up`, `await RH`, `check later`, or `apply` tasks without a verified concrete next action and correct owner.
- When an actionable task is actually finished (e.g. official submission receipt obtained, a discrete Gmail Sent/DSN check performed, a live URL verified), complete that existing task **in the same run** with `status='completed'`, `completed_at=now()` and dated evidence. The *application* may still await RH and must stay in its real stage. An unresolved technical recovery must stay open; a failed attempt is not a completion.
- Do not mechanically mark pending tasks complete, dismiss them, delete them, or reclassify candidate tasks just to improve the KPI. Preserve stage, deadline, source, notes and prior events. Check for actual duplicate work and treat discovered opportunities as pipeline records rather than a new action queue for every row.
- Before and after every Submit! run, query the current open Agent task count and report `before → after`. If it increases, disclose **which real new uncompleted actions** caused the increase and which previously open tasks were completed; do not present backlog growth as progress.
- A paused Career Radar automation is not performing passive monitoring. Never claim otherwise or silently reactivate it; preserve its existing enabled/paused state until an explicitly authorized change. Checking the mailbox during the current recruiting run does not promise future scheduled checks.

Do not end after a few portals fail or an arbitrary quota. Continue through independent items. If a genuine execution/tool limit prevents finishing, checkpoint the exact remaining task IDs and next item in private tracker notes and report that the run is partial; never imply all work was attempted or promise an unscheduled continuation.

Use responsible exactly Candidate or Agent. Split shared work into distinct tasks. Research, URL recovery and technical retries belong to Agent. Candidate tasks require a specific personal answer, assessment or human verification. Waiting alone is application status, not an actionable task; retain concrete receipt/bounce checks separately. Never mark waiting, a failed attempt or dismissal as successful completion to reduce the counter.

Before RDC, read C:\Users\Usuario\AI-Apps\READMEAI.md. All ordinary portal browsing uses the shared visible Edge profile at %LOCALAPPDATA%\AI-Browser\UserData via CDP http://127.0.0.1:9222, reusing its existing context and coordinating the exclusive control lock. Keep CAPTCHA/login handoffs in the same tab. Do not cycle through old profiles or create replacement/headless contexts. Do not close the browser or export session secrets. If blocked there, continue independent connector work.

The dashboard replaces the old seven-section report. End with a short update: verified new submissions and completed actions, remaining AI count (before → after when known), and specific new candidate-only blockers with links/deadlines. Mention material failures/unattempted work briefly. Link https://carreer.johnvitor.com for full details. A zero or unchanged count must be stated honestly. Do not repeat the full pipeline or a 1–7 summary unless explicitly requested.

## Checks

Run `npm run typecheck`, `npm test`, and `npm run build` after substantive changes. Browser-check visible changes using the supported preview. Do not weaken RLS to simplify preview or tests. Keep dependency versions pinned and commit `package-lock.json`.

## Candidate browser handoff

Dashboard “Your actions” links use the per-user `career-browser:` launcher (source in `scripts/shared-browser`). Before controlling the shared browser, check `%LOCALAPPDATA%\AI-Browser\human-handoff.json`. Its presence means Candidate is working: do not navigate/reload/automate candidate tabs or remove the marker until the user explicitly returns control. Keep the exact tab/context for login and CAPTCHA. Independent connector work may continue. The marker contains tab ID/time only; do not log portal URLs or session secrets.

When asked to work headlessly, all browser validation must stay headless in isolated QA state. Never launch/activate a visible browser as a test. The candidate may deliberately open the shared visible session through the dashboard launcher; do not do that on their behalf during headless work.
