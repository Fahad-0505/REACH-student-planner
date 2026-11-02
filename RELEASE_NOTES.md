# Release notes — Final internship handover

- Premium mobile-first REACH visual direction aligned to the approved Figma system.
- Fixed-width 440px app geometry on larger screens, responsive down to narrow mobile.
- Correct assignment selection when opening a plan.
- Real completed-assignment count.
- Added semester setup and unit-outline review journey.
- Added local persistence migration.
- Added safer output escaping for key assignment content.
- Added PWA manifest and service worker for install/offline support.
- Production deployed on Render from the public GitHub repository.
- Demo information is fictional.


## Final v3 polish
- Reworked dark mode contrast with explicit accessible dark surfaces, off-white primary text, muted secondary text, and dark-aware event/chip/status colors.
- Replaced the semester-first experience with a clickable Units & Outlines hub.
- Added per-unit detail views with assessment/deadline summaries.
- Added local unit-outline PDF/TXT analysis for text-based documents using PDF.js.
- Extracted assessment titles, types, likely weightings, due dates and due times are presented as editable suggestions.
- Student confirmation is required before extracted items are added to Assignments.
- Confirmed dated assessments feed the Planner's upcoming unit deadlines.
- Unit outline files are processed locally in the browser and are not sent to a third-party AI service.
- Scanned/image-only PDFs require manual review/entry because OCR is intentionally not bundled into the release.

## Wellbeing + account production release
- Added user-defined reward thresholds and claimable self-rewards.
- Added PDF/DOCX/TXT assignment-brief reading with file-specific document proof (file name, extracted character count and brief fingerprint).
- Strengthened understanding checks so feedback compares the student's explanation with brief-specific instructions rather than returning a generic positive response.
- Added editable assignment plans with custom task names, minutes and target dates.
- Added optional Supabase email/password accounts with cross-device planner sync.
- Added password recovery, accurate sync-status messaging, safer sign-out options and explicit synced-planner deletion.
- Kept original uploaded assignment files local to the browser; only extracted text and planner data are eligible for cloud sync.
- Updated the PWA cache so existing installs receive the new release.

### Final wellbeing audit fixes
- Fresh users now start with clean data: 0 points, no demo units/assignments/commitments, and no pre-selected reward.
- Replaced fake planner capacity and placeholder study events with real remaining task minutes, real commitments and user-set target dates.
- Energy check-ins now adjust the suggested focus block.
- Focus timer now supports reliable pause/resume/reset and a real focus → recharge cycle; completed focus sessions are recorded.
- Gentle due-date browser reminders are opt-in and only run while the app/PWA is open.
- Active/Completed assignment filters now work, and assignments can be deleted without removing already-earned growth points.
- Restored semester to the saved/synced profile and personalised header initials.
- Removed unconditional positive fallback feedback and remaining demo-only UI copy.
- Escaped additional student-entered fields to reduce unsafe HTML rendering.
