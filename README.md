# Career Radar

Private recruitment workspace: https://carreer.johnvitor.com. Next.js dashboard, Supabase live data, Git-triggered Vercel deployment.

## One home for each kind of information

| Information | Maintained source |
| --- | --- |
| Workflow, permissions and verification | [AGENTS.md](AGENTS.md) |
| Candidate facts, approved answers and writing templates | Private Supabase Candidate Knowledge (`career_radar_candidate_answers`) |
| Required sensitive identity fields | Separate protected Vault record |
| Applications, actions, evidence and history | Supabase `applications`, `tasks`, `stage_events` |

The dashboard's **Knowledge** button reads the complete, owner-only contents of the existing encrypted candidate and identity records on demand. All saved fields are available in searchable sections, including contact, declarations, compensation, sources and identity. New fields appear automatically. It stores no second profile. Gmail and employer portals provide original evidence; the tracker links to it. Historical imports are backups.

## Project prompt

Use this short entry point in the Recruiting project settings. Keep operating rules and candidate facts in their maintained sources:

> Manage Career Radar. Before recruiting or development work, read and follow the current https://github.com/metrix0/carreer-system/blob/main/AGENTS.md. Load the live tracker and private Candidate Knowledge as directed there. Follow my current request; save durable corrections in the appropriate source. Keep replies brief.

The existing automation also references AGENTS.md. Its schedule and enabled state are managed in Automations; README does not assert execution state.

## Development

Node 20.9+. Run `npm ci`, `npm run dev`. Required checks: `npm run typecheck`, `npm test`, `npm run build`.

The build exports `out/`. Public Supabase settings are in `lib/supabase.ts`, with optional overrides in `.env.local`. Never put a privileged key in client code. Owner-only RLS protects pipeline data; only the confirmed owner can read Knowledge through a narrow RPC. The preview uses synthetic data.

Database baseline: `supabase/schema.sql`; incremental changes: `supabase/migrations/`. Private historical imports use `scripts/prepare-import.ts` and stay outside Git. Shared browser launcher setup: `scripts/shared-browser/install.ps1`. Operational browser and privacy rules live only in AGENTS.md.
