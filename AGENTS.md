# Career Radar implementation and operations

Keep the product to one focused dashboard. Preserve data and stage history. Never ship private tracker exports, email text, credentials, or personal declarations in public GitHub source or client build output.

## Source of truth

The dashboard reads Supabase project `obwktteidluebaksfhju`. Read the current schema before writes. Use the CARREER SYSTEM Supabase connection; never another project's connection. Keep the legacy tracker as a backup during cutover. Do not pause, replace or claim to have migrated background execution unless its replacement is verified.

## Worker / agent writes

- `applications.source_key` is unique. Reuse existing keys; deduplicate by employer requisition and URL before inserting. Read `source_data` and existing history when reconciling imported aliases.
- Stage values: `discovered`, `subscribed`, `screening`, `interview`, `offer`, `hired`. `screening` means an active post-submission step, not necessarily a completed or passed assessment. Do not infer interviews from an automated assessment invitation.
- `outcome`: `active`, `rejected` (explicit individual rejection), `closed` (vacancy ended), `excluded` (confirmed ineligible).
- Set `submission_verified=true` only with reliable employer or platform confirmation, put the actual receipt in `confirmation`, and only populate `submitted_at` when its actual date is known. Sent email or an uploaded CV alone is not receipt confirmation. Do not reapply to an email-sent process without checking for duplicates and delivery.
- `tasks.status`: `pending`, `blocked`, `completed`. Blocked is a task state, not a Kanban stage. Capture `last_stage` from the application when creating a task. Include exact next action, responsible party, deadline and direct URL. Do not make waiting for recruiter responses a blocked task.
- To complete a task, update both `status='completed'` and `completed_at` atomically. Record stage completion only after verification.
- Application inserts and stage/outcome changes append `stage_events` automatically. Do not directly alter that history. Use `updated_at` as an optimistic-concurrency condition when updating records and refresh on conflict.
- Workers can use the authorized Supabase MCP connection or a server-only service credential. No service credentials belong in browser code, public files, shell arguments or logs.

## Authorization

New applications require the user's explicit Submit! / Subscribe!. Adding a record, moving a card or clicking an application URL does not authorize submitting to an employer. Approved routine follow-up stages are automatic. Escalate human-required assessments, CAPTCHAs, uncertain legal declarations and significant commitments. Never fabricate personal facts, test responses, submission receipts or interview invitations.

## Recruitment run contract

For recruiting work, read the live Supabase applications, tasks and stage_events before acting. The spreadsheet is historical backup, not an execution dependency.

Submit! / Subscribe! authorizes actual applications to all eligible, unapplied opportunities in the current run. Process the existing Agent action queue as work to execute, not merely a list to summarize. Prioritize post-submission progress, then initial applications by fit and deadline. Inspect all pages of the queue; exclude completed and [dismissed] tasks and respect concurrent updates.

For each actionable item: inspect current evidence, perform the authorized next step, verify the result and persist it immediately. Complete tasks atomically with completed_at only after verified completion. An attempted but unsuccessful submission stays open with dated evidence, exact error, next recovery step and owner. Record attempts in task notes without erasing prior evidence. Re-read before writing and do not duplicate tasks.

Do not end after a few portals fail or an arbitrary quota. Continue through independent items. If a genuine execution/tool limit prevents finishing, checkpoint the exact remaining task IDs and next item in private tracker notes and report that the run is partial; never imply all work was attempted or promise an unscheduled continuation.

Use responsible exactly Candidate or Agent. Split shared work into distinct tasks. Research, URL recovery and technical retries belong to Agent. Candidate tasks require a specific personal answer, assessment or human verification. Waiting alone is application status, not an actionable task; retain concrete receipt/bounce checks separately. Never mark waiting, a failed attempt or dismissal as successful completion to reduce the counter.

Before RDC, read C:\Users\Usuario\AI-Apps\READMEAI.md. All ordinary portal browsing uses the shared visible Edge profile at %LOCALAPPDATA%\AI-Browser\UserData via CDP http://127.0.0.1:9222, reusing its existing context and coordinating the exclusive control lock. Keep CAPTCHA/login handoffs in the same tab. Do not cycle through old profiles or create replacement/headless contexts. Do not close the browser or export session secrets. If blocked there, continue independent connector work.

The dashboard replaces the old seven-section report. End with a short update: verified new submissions and completed actions, remaining AI count (before → after when known), and specific new candidate-only blockers with links/deadlines. Mention material failures/unattempted work briefly. Link https://carreer.johnvitor.com for full details. A zero or unchanged count must be stated honestly. Do not repeat the full pipeline or a 1–7 summary unless explicitly requested.

## Checks

Run `npm run typecheck`, `npm test`, and `npm run build` after substantive changes. Browser-check visible changes using the supported preview. Do not weaken RLS to simplify preview or tests. Keep dependency versions pinned and commit `package-lock.json`.
