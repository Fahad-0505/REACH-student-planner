# REACH Student Planner — Production Handover

## Production services
- **GitHub:** source control for the web/PWA.
- **Render:** production static-site hosting and automatic deployment from the `main` branch.
- **Supabase:** email/password authentication, per-user cloud storage, Realtime cross-device updates and authenticated Edge Functions.
- **Browser/PWA:** local-first storage, offline shell, document parsing, focus timer and notifications.

## Client data flow
1. The app saves changes immediately to browser local storage.
2. A client may create a Supabase email/password account.
3. When signed in, planner state is stored in `public.planner_state` under that user's auth UID.
4. Row Level Security restricts the row to its owner.
5. Realtime updates can refresh another signed-in device.
6. Original assignment/unit-outline files are processed in the browser and are not stored as uploaded files.
7. Text extracted from a brief can be included in the synced planner state so the assignment remains usable across devices.
8. A client can export a JSON backup, delete synced planner data, or permanently delete the account.

## Production ownership
REACH should retain access to:
- GitHub repository
- Render workspace/service
- Supabase organisation/project
- DNS/custom domain if introduced later
- Any future email SMTP provider
- Any future AI/API provider

Do not leave a production secret in frontend JavaScript. Supabase publishable keys are safe for browser use when RLS is correct; service-role keys and third-party API secrets must remain server-side.

## Before broad client rollout
- Configure Supabase Auth Site URL and redirect URLs for the final public domain.
- Enable leaked-password protection in Supabase Auth.
- Configure branded transactional email/SMTP for account confirmation and password recovery.
- Create a REACH privacy policy and terms/support contact approved by REACH.
- Run an accessibility and mobile-device acceptance test on iOS Safari and Android Chrome.
- Create at least two real test accounts and verify cross-device sync, password recovery and account deletion.
- If REACH adopts a custom domain, update auth redirects and test the installed PWA again.

## Maintenance
GitHub `main` is production. Render auto-deploys commits. Keep release notes for user-facing changes and bump the service-worker cache version after frontend releases that must invalidate an installed PWA cache.
