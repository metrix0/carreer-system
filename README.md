# Career Radar

A focused Next.js dashboard for the path from opportunity to interview. Supabase stores the live pipeline; no recruitment data ships in the public repository or static build.

## Dashboard

- Six vertical Kanban columns: Discovered, Subscribed, Passed / screening, Interview, Offer, Hired.
- Search, drag and drop, application detail dialogs, stage history, archived outcomes and manual opportunity creation.
- Blocked and remaining actions with the stage captured when the task was created. Rank by stage proximity to interview, then deadline. Waiting for a recruiter is not a blocked task.
- Weekly verified submissions compared with the previous week, active applications, interviews and conversion, and open actions. Weeks start Monday at midnight in America/Sao_Paulo. Unknown historical dates are disclosed and excluded from weekly totals.
- Supabase authentication and owner-only RLS. The preview uses visibly labeled synthetic data and never writes to the live workspace.

## Run

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Node 20.9+ is required. The build exports the Next.js app to `out/`; Vercel detects Next.js automatically. The checked-in publishable Supabase settings are deliberately public and can be overridden through `.env.local` using `.env.example`. Never use a service-role key in a `NEXT_PUBLIC_` variable.

## Authentication setup

The first visit requires creating a Supabase account and confirming the email. Only the confirmed workspace owner email provisioned in `private.owner_access` has access to any records. Other signed-in users see no rows and cannot create or update records.

In Supabase Auth URL Configuration, set Site URL to the deployed application URL and allow the same redirect URL. Configure email delivery for the owner's address (Supabase's default email service may restrict delivery to project team addresses). Sign-in with password, email confirmation, and magic links use the Supabase Auth client; no credentials are stored in this repository.

## Database

`supabase/schema.sql` describes the clean schema. The live project's schema was applied using Supabase migrations. `applications` has a unique source key, original evidence, verified submission state, original tracker status and full source data. `tasks` references applications. Database triggers append `stage_events`; clients cannot rewrite history. Private import snapshots retain all original source tabs.

The owner allowlist is provisioned separately and is never client-writable. All public tables enable RLS. Private snapshots are not exposed through the client Data API. The audit trigger runs AFTER an application is inserted so its foreign key exists; timestamps are updated in a separate BEFORE UPDATE trigger.

## Import

Source: the existing Career Radar Google Sheets workbook. Its original opportunities, processes, exclusions and rules are retained in a private snapshot. A repeated Gupy requisition becomes one application with both original rows. Historical process-only entries stay unverified until reconciled. Employer closure is separate from individual rejection. Email-sent and drafts do not become confirmed submissions. Assessment invitations never become interviews.

To prepare an import from a privately exported JSON object with `opportunities`, `processes`, `discarded`, `rules` arrays (each includes its header row):

```sh
node --import tsx scripts/prepare-import.ts /private/tracker.json /private/import.sql
```

Review the summary and SQL, then apply through an authorized database connection. Both files contain private recruitment data: keep them outside this repository. Application imports use `ON CONFLICT DO NOTHING` and task imports skip existing matching titles, preserving later app edits. Full source snapshots are append-only.

## Recruitment automation

This milestone implements the dashboard, database, historical import and agent write contract. The existing hourly Career Radar automation has been updated to read this Supabase project and persist verified results after every stage, while retaining the sheet as a backup. Its schedule is unchanged. That task remains the execution engine for Gmail and portal follow-through; browser automation does not run inside the dashboard. End-to-end execution of a future scheduled run has not been verified by this build. See `AGENTS.md` for the contract. The app refreshes its Supabase data on focus, every minute, and on demand.

New submissions still require an explicit Submit! / Subscribe! instruction. Automatic follow-up stages may proceed within the user's approved rules. Human-required assessments and legal declarations become blocked actions. A stage change is a tracking update, never an application submission.

## Validation

Six focused tests cover São Paulo week boundaries, dated and verified submission counts, task priority, safe links, import classification, and requisition deduplication. A production build and TypeScript check are required. Database verification includes imported totals, append-only stage history and authenticated non-owner RLS isolation. Browser checks cover dashboard preview interactions; real owner sign-in requires the owner's confirmed session.

### Shared browser links (Windows)

“Your actions” link buttons use `career-browser:open?url=…` to open the same visible Edge profile as RDC/Playwright. On the Windows PC run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/shared-browser/install.ps1` once. This registers a per-user launcher; the browser may ask permission to open it. Other computers need their own setup. AI action links retain ordinary browser behavior.

The launcher uses `%LOCALAPPDATA%\AI-Browser\UserData` and loopback CDP port 9222. It remembers each task’s tab ID, so reopening it preserves a login/CAPTCHA redirect; otherwise it reuses a matching URL or opens a new tab in the existing context. It never imports cookies, closes the browser, or creates an incognito context. CAPTCHA and login remain in that tab; approvals can expire.

Opening a candidate link writes `%LOCALAPPDATA%\AI-Browser\human-handoff.json` containing only the tab ID and handoff timestamp. Agents must check this marker before browser control and leave candidate work untouched. Resume only after the candidate explicitly hands control back; remove the marker then, without closing tabs. The launcher only accepts HTTPS destinations and invokes no shell with URL content. To uninstall, remove `HKCU\Software\Classes\career-browser`; profile data stays untouched.

Validation must stay headless while the candidate uses the PC. Compile `SharedBrowser.cs` with `/define:QA /target:exe` to test the same launcher logic in an isolated headless profile under `%TEMP%\CareerBrowserLauncher-QA` on port 19322. Never invoke the installed visible launcher as an automated smoke test. Its visible mode is for an explicit candidate click.
