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
