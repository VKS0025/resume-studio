# Resume Studio

A resume builder: fill in your details once, switch between seven layouts live,
then download the result as a **PDF**, **PNG** or **JPEG**.

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase · TypeScript.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3001 (its own port, so it never collides with another local dev server). No configuration is needed — without a Supabase
project the app stores resumes in the browser's `localStorage`.

## Accounts and cloud save (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```

3. Run `supabase/migrations/0001_resumes.sql` in the project's SQL editor. It
   creates the `resumes` table with owner-only row level security.
4. Restart `npm run dev`. `/login` now works, and any resumes made while signed
   out are moved into the account on first sign-in.

Email confirmation is on by default in Supabase. Turn it off under
*Authentication → Providers → Email* if you want sign-up to log straight in.

## How it is put together

| Path | What it does |
| --- | --- |
| `src/lib/resume.ts` | The one `ResumeData` shape the editor, every template and the database all share. `normalizeResume()` keeps older saved rows loadable. |
| `src/lib/export.ts` | PNG / JPEG / PDF rendering. Rasterises the live preview node, then slices that image onto A4 pages for the PDF. |
| `src/lib/store.ts` | One CRUD interface over Supabase *or* `localStorage`, chosen at call time by whether a session exists. |
| `src/components/ResumePaper.tsx` | The A4 sheet, laid out at exactly 794 × 1123 px (A4 at 96 dpi) — the size the exporter captures. |
| `src/components/templates/` | The seven designs. `SectionContent.tsx` holds the shared body markup; each template supplies its own framing. |
| `src/components/editor/` | The left-hand editor: content forms, design controls, section ordering. |
| `src/proxy.ts` | Next 16's replacement for middleware. Refreshes the Supabase session cookie; it deliberately does **not** gate any route, so signed-out use keeps working. |

### Why the preview is the export

Both the on-screen sheet and the downloaded file come from the same DOM node at
the same layout size. Zoom is a CSS transform on a wrapper, so changing it never
changes the output. Editor-only chrome (the dashed page-break markers) is tagged
`data-export-ignore` and filtered out at capture time.

### Adding a template

1. Add a component in `src/components/templates/` that takes `{ data }`.
2. Register it in `src/components/templates/index.tsx` with a name and blurb.
3. Add its id to the `TemplateId` union in `src/lib/resume.ts`.

The picker thumbnail in `DesignPanel.tsx` falls back to a generic wireframe, so
a new template works without touching it.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build (also typechecks)
npm run lint    # eslint
```

## Job feed

Listings come from [Adzuna](https://developer.adzuna.com) — Indeed and LinkedIn
both forbid scraping and actively block it, so neither is a viable source.

`vercel.json` runs `/api/ingest/jobs` once a day at 02:00 UTC. Daily is the most
frequent schedule Vercel's Hobby plan accepts; on Pro, change `schedule` to
`0 */6 * * *` for a fresher board. (`vercel.json` rejects unknown keys, so this
note lives here rather than as a comment in the file.)

Trigger a fill by hand:

```bash
curl -H "Authorization: Bearer $INGEST_SECRET" https://<host>/api/ingest/jobs
```
