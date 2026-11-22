# REACH Student Planner — Handover Status

**Release:** 1.0 production candidate  
**Production URL:** https://reach-adhd-student-planner.onrender.com

## Completed
- Local-first planner and optional authenticated cloud sync
- Per-user Supabase RLS and Realtime architecture
- Shared-device account-switch protection
- Password reset and account deletion
- PDF/DOCX/TXT parsing plus scanned-PDF OCR
- File-specific brief analysis and fingerprints
- Brief-vs-student-understanding feedback
- Custom task breakdowns, time estimates and target dates
- Planner, focus/recharge, progress and student-selected rewards
- Optional confidence/reflection accountability flow
- Student-initiated support-person email drafts
- Browser notifications plus native calendar reminder export
- Offline PWA/install support
- Academic-integrity guardrails
- Privacy-safe support diagnostics
- GitHub smoke tests and cross-browser acceptance tests
- Production/handover/security documentation

## Verified backend state
- Supabase project restored and healthy during final release testing.
- RLS owner CRUD test passed.
- Cross-user RLS isolation test passed.
- No Supabase performance or health advisor findings.
- Supabase leaked-password advisory remains because HaveIBeenPwned protection requires Pro+; app-side password rules are strengthened for the Free-plan release.

## Platform caveats, not application defects
- Supabase Free projects can pause after sustained low activity. Upgrade the Supabase organisation if REACH requires guaranteed always-on backend availability.
- Render reports auto-deploy enabled but Git push delivery is not firing reliably. Manual **Deploy latest commit** is the tested release procedure until the Render GitHub integration is re-authorised.
- Real physical-device installation/notification behaviour can vary by OS; automated Chromium/WebKit mobile acceptance testing is included, but a final human spot-check is still appropriate before distributing broadly.

## Release rule
Do not hand clients an untested GitHub commit. The production Render deployment should match the latest `main` commit after GitHub smoke/browser checks pass.
