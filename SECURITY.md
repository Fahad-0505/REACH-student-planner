# Security Notes

- Supabase Row Level Security is enabled on `public.planner_state`.
- Authentication uses Supabase Auth; the frontend never stores user passwords itself.
- The frontend uses only a Supabase publishable key.
- Permanent account deletion is handled by an authenticated Edge Function so the service-role credential is never exposed to the browser.
- The obsolete demo Edge Function is deprecated and now requires a valid JWT.
- User-entered content should always be escaped before HTML rendering.
- Local-first data can remain on a shared device after sign-out unless the client uses **Sign out & clear this device**.
- Uploaded documents are parsed locally. OCR for scanned PDFs is performed in the browser after loading the OCR library.
- Do not add third-party analytics, advertising trackers or AI services without a privacy review and explicit REACH approval.
