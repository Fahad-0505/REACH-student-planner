# Security Notes

- Supabase Row Level Security is enabled on `public.planner_state`; users should only be able to access their own row.
- Authentication uses Supabase Auth. The frontend never stores account passwords itself.
- The frontend contains only a Supabase publishable key. Service-role credentials are used only inside authenticated server-side functions.
- Permanent account deletion is handled by the authenticated `delete-account` Edge Function.
- The obsolete `student-planner-demo` function is deprecated and requires a valid JWT.
- The app records a cloud owner marker and requires explicit confirmation before attaching retained local planner data to a different/new account on a shared device.
- User-entered content rendered into HTML must pass through escaping helpers.
- Local-first data remains on a device after ordinary sign-out by design; use **Sign out & clear this device** on a shared device.
- Uploaded documents are parsed locally. OCR for scanned PDFs is performed in the browser.
- Original assignment files are not stored by the planner; extracted brief text may be included in synced planner state.
- Accountability check-ins are optional. The planner never automatically emails a coach/support person; the student must explicitly open and review the email draft.
- No third-party analytics, advertising trackers or semantic AI services should be added without REACH privacy review and approval.
- Supabase currently reports one Auth warning: leaked-password protection is disabled. Enable it in Auth settings before broad client rollout.
