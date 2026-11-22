# REACH Student Planner — Production Handover

## Final production target
- **Public app:** https://reach-adhd-student-planner.onrender.com
- **Source:** GitHub `Fahad-0505/REACH-student-planner`, branch `main`
- **Hosting:** Render static site `reach-adhd-student-planner`
- **Accounts/data:** Supabase project `REACH Student Planner`

A custom domain is not required for handover. REACH can introduce one later without rebuilding the app.

## Client data flow
1. Planner changes save to browser local storage immediately.
2. A client can use the planner locally or create an email/password account.
3. Signed-in planner state is stored in `public.planner_state` under the authenticated user's UID.
4. Row Level Security restricts SELECT/INSERT/UPDATE/DELETE to the row owner.
5. Realtime can update another signed-in device.
6. Shared-device account switching is guarded so retained local data is never silently attached to a different account.
7. PDFs, scanned PDFs, DOCX and TXT files are read in the browser. The original file is not stored by the planner.
8. Extracted brief text and planning metadata may sync so the same account can continue on another device.
9. Accountability check-ins are optional; email sharing is always initiated by the student.
10. Clients can export/import a backup, delete synced data, clear a device, or permanently delete their account.

## Academic-integrity position
No external generative-AI service is used in this release. This is intentional. Brief analysis identifies planning requirements (deliverable, action words, word length, referencing, sources, structure and key instructions), then compares those requirements with the student's own understanding. The app does not write assessment content, generate references/citations or tell a student that generated work is acceptable.

If REACH later considers semantic AI, it should be a separate privacy/academic-integrity review rather than a silent feature addition.

## Reminders
The app supports browser notifications when the platform allows them. Because a PWA cannot guarantee scheduled notifications while fully closed on every browser/OS, the production release also provides **Download calendar reminders (.ics)**. Students can import those deadlines/study targets into their device calendar for reliable native reminders.

## Account security
- Supabase Auth stores password hashes; the frontend never stores account passwords.
- New/recovery passwords are required by the app to be at least 12 characters and include uppercase, lowercase, a number and a symbol.
- Supabase Row Level Security is enabled and has been functionally tested for both owner CRUD and cross-user isolation.
- Supabase's leaked-password/HIBP protection is not available on the current Free organisation plan. If REACH upgrades Supabase later, enable that option as an additional defence.
- Permanent account deletion is handled by the authenticated `delete-account` Edge Function.

## Supabase Free-plan availability
The current Supabase organisation is on the Free plan. Free projects can be automatically paused after sustained low activity. The project was restored during final testing and is currently healthy. For a client-facing service that REACH expects to remain continuously available regardless of activity, upgrading the Supabase project is the platform-level reliability option; it is not required to run the application today.

## Quality controls completed
- Production JavaScript/PWA smoke tests in GitHub Actions.
- Browser acceptance suite for Desktop Chromium, Android-sized Chromium and iPhone-sized WebKit.
- Live RLS owner CRUD transaction test: passed.
- Live cross-user SELECT/UPDATE/DELETE isolation test: passed.
- Supabase performance advisor: no findings.
- Supabase health advisor: no findings.
- Frontend scan verifies no Supabase service-role credential is present.
- Versioned service worker provides offline shell and controlled cache invalidation.

## Deployment
Render's service is correctly connected to `main` and reports auto-deploy enabled, but Git push-triggered deployments were not firing reliably during final testing. This is an external GitHub↔Render integration issue, not a build failure.

**Reliable handover procedure:** after a production code change, run the GitHub checks, then use Render → service → **Manual Deploy / Deploy latest commit**. This has been tested successfully. The deployment must show the same commit SHA as GitHub `main`.

If REACH wants automatic deployments later, reconnect/re-authorise the Render GitHub integration in the Render dashboard.

## Ownership
REACH should retain access to GitHub, Render and Supabase. No custom domain, paid SMTP provider or external AI provider is required for this release.

## Support
Settings includes a privacy-safe **System status** card and **Copy diagnostic summary**. It reports version/connection/install/account/sync counts without copying student names, emails, brief text or uploaded files.
