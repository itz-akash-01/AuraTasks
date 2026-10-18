# Aura Dashboard Demo — by Mr Akash

Static front end (HTML/CSS/JS, no build step) plus one serverless endpoint (`api/enquiry.js`). **Demo version:** tasks, projects, messages and settings use sample data saved in the visitor's own browser (localStorage). That is not a shared database, and it is labelled as such in the UI.

## Run locally
- Front end only: open `index.html`, or `npx serve .`
- With the API: `npm i -g vercel`, then `vercel dev`

## Deploy (free, works from a phone browser)
1. Create a GitHub account and a new repository. Upload every file in this folder (the GitHub mobile site's "Add file → Upload files" works; keep the `api` folder).
2. Sign in at vercel.com with GitHub, tap **Add New → Project**, import the repository, leave all build settings empty, tap **Deploy**.
3. Optional email delivery: create a free Resend account, then in Vercel → Settings → Environment Variables add the three names from `.env.example`, and redeploy. Without them the form validates but reports "not delivered".
4. Custom domain: Vercel → Project → Settings → Domains → Add. Add the DNS record Vercel shows (A record for the root domain, CNAME for `www`) at your domain registrar, then wait for it to verify. HTTPS is automatic.

## Security checklist before launch
- [ ] No real secrets in the repo (`.env` is git-ignored; only `.env.example` is committed)
- [ ] Resend key and emails set only as Vercel environment variables
- [ ] Open the live site and confirm the security headers in `vercel.json` apply (browser DevTools → Network)
- [ ] Submit the form with bad input and with valid input; check both responses
- [ ] The in-memory rate limit is best effort on serverless; add Vercel's firewall rate limiting for real traffic

## Test checklist
- [ ] Phone, tablet, laptop widths; mobile menu opens and closes
- [ ] Every sidebar item opens a real view; search (Ctrl/Cmd+K) filters tasks
- [ ] Add (with errors), complete, filter, delete, export tasks; reload and confirm they persist
- [ ] Calendar due-date dots; period switch on the chart; dark mode; Reset demo
- [ ] Enquiry form: validation, loading state, success, and failure when offline

## Troubleshooting
- 404 on `/api/enquiry`: the `api` folder was not uploaded, or you are on a static-only host.
- Form says "Could not reach the server": you opened `index.html` directly; use `vercel dev` or the deployed site.
- Fonts missing: Google Fonts is blocked or offline; fallback fonts are used.
- Blank styles after adding a CDN script: `vercel.json` CSP only allows same-origin scripts; edit it deliberately.

## v3 changes
- New theme layer (`theme.css`, `theme.js`): muted-neutral light mode and a neon indigo/cyan dark mode; theme applies before first paint, follows the OS until you choose, and switches with a short transition.
- Tasks can now be edited; rows toggle on click; calendar has a selected day and an "Add task for this day" button; the mobile menu has a backdrop, Esc and a close button.
- Saved browser data is validated on load, so corrupt or old data can no longer break the page.
- Security: same-origin check, content-type and size limits on `/api/enquiry`; HSTS, COOP/CORP and X-Frame-Options added in `vercel.json`.
