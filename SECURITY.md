# Security Notes

- Supabase Row Level Security is enabled on `public.planner_state`.
- Live transaction tests passed for owner INSERT/SELECT/UPDATE/DELETE and for cross-user SELECT/UPDATE/DELETE isolation.
- Authentication uses Supabase Auth; the frontend does not store passwords.
- New/recovery passwords are validated in the app for 12+ characters with uppercase, lowercase, number and symbol.
- The frontend contains only a Supabase publishable key. No service-role credential is exposed to browser code.
- Permanent account deletion uses the authenticated `delete-account` Edge Function.
- The obsolete `student-planner-demo` function requires a valid JWT.
- `cloudOwnerId` plus explicit conflict prompts prevent retained local data from silently crossing between accounts on shared devices.
- **Sign out & clear this device** should be used on shared/public devices.
- User-controlled text inserted into HTML is escaped.
- Uploaded documents are parsed locally; scanned-PDF OCR is performed in the browser.
- Original assignment files are not stored by the planner. Extracted text can be part of synced planner state.
- Accountability check-ins are optional and never auto-email a support person.
- No third-party analytics, advertising trackers or external semantic/generative-AI service is included.
- Supabase currently reports one Auth advisory: leaked-password protection is disabled. That protection is a Supabase Pro+ feature; the current REACH organisation is Free, so the release instead enforces stronger application-side password rules.
- The current Supabase Free plan may pause after sustained low activity. For guaranteed always-on production availability, REACH should move the project to a paid plan.
