# REACH Student Planner — Production Handover

## Production services
- **GitHub:** source control and production history.
- **Render:** production static-site hosting from the `main` branch.
- **Supabase:** email/password authentication, per-user cloud storage, Realtime cross-device updates and authenticated Edge Functions.
- **Browser/PWA:** local-first storage, offline shell, document parsing/OCR, focus timer, optional reminders and install-to-home-screen behaviour.

## Client data flow
1. Changes are saved to browser local storage immediately.
2. A client may use the planner without an account, or create a Supabase email/password account.
3. When signed in, planner state is stored in `public.planner_state` under that user's auth UID.
4. Row Level Security restricts each row to its authenticated owner.
5. Realtime updates can refresh another signed-in device.
6. The app detects account switches on shared devices and will not silently sync one user's retained local planner into another account.
7. Assignment briefs and unit outlines are processed in the browser. Normal PDFs use PDF.js, DOCX uses Mammoth.js, and scanned PDFs fall back to in-browser OCR.
8. Original uploaded files are not stored by the planner. Extracted text and planning metadata can sync so the student can continue on another device.
9. Optional accountability check-ins store a confidence score/reflection in the planner. Email sharing is always initiated by the student and opens a pre-filled email draft on their device.
10. A client can export/import a JSON backup, delete synced planner data, sign out and clear a device, or permanently delete the account.

## Quality controls
- `tests/smoke.mjs` checks JavaScript syntax, PWA configuration and required production/security markers.
- GitHub Actions runs the smoke check on every push to `main` and on pull requests.
- The service worker uses a versioned cache and separates navigation fallback from asset caching.
- Supabase security/performance advisors should be reviewed before each client rollout.

## Production ownership
REACH should retain access to:
- GitHub repository
- Render workspace/service
- Supabase organisation/project
- DNS/custom domain if introduced later
- Any future email/SMTP provider
- Any future AI/API provider

Do not put service-role credentials or third-party API secrets in browser JavaScript.

## Business decisions still required before broad public rollout
These are configuration/ownership decisions rather than missing frontend code:
- Decide whether to use the Render URL or a REACH custom domain.
- Configure Supabase Auth Site URL/redirect URLs for the final domain.
- Enable Supabase leaked-password protection in Auth settings.
- Decide whether REACH wants branded transactional email/SMTP for verification and password reset.
- Approve client-facing privacy policy/terms/support wording.
- Decide whether REACH wants a third-party semantic AI service for deeper assignment interpretation. No external AI service is currently used for brief analysis.
- Decide whether REACH needs true server push notifications while the PWA is completely closed. Current reminders are browser notifications while the app is active; closed-app push requires a push service/VAPID backend.

## Acceptance testing before Fiona's final handover
Use at least two test accounts/devices and complete the checklist in `RELEASE_CHECKLIST.md`. In particular verify:
- sign-up/email confirmation/password reset;
- local-only → account sync;
- account switch on the same device;
- cross-device Realtime sync;
- account deletion;
- normal PDF, scanned PDF OCR and DOCX brief parsing;
- understanding check produces brief-specific feedback;
- custom task dates appear in Planner;
- focus/recharge cycle;
- rewards;
- accountability check-in + email draft;
- offline reopen after the app has previously loaded;
- iOS Safari and Android Chrome install behaviour.

## Maintenance
GitHub `main` is production. Render is configured for automatic deployment, but deployment status must still be verified after a release. Bump the service-worker cache version whenever frontend files need to invalidate an installed PWA cache.
