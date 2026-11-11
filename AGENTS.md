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

## Checks

Run `npm run typecheck`, `npm test`, and `npm run build` after substantive changes. Browser-check visible changes using the supported preview. Do not weaken RLS to simplify preview or tests. Keep dependency versions pinned and commit `package-lock.json`.
