# REACH Student Planner

A mobile-first, ADHD-friendly student planning and study-wellbeing web application developed for REACH ADHD Coaching & Consultancy.

## Production app
https://reach-adhd-student-planner.onrender.com

## Purpose
The planner helps students reduce overwhelm by turning assessment requirements into manageable steps, planning study around real-life commitments, using short focus blocks, recognising progress positively, choosing meaningful self-rewards and optionally sharing study wins with a trusted support person.

## Production stack
- Frontend: dependency-light HTML, CSS and JavaScript
- Hosting/CDN: Render Static Site
- Source control and CI: GitHub + GitHub Actions
- Accounts and cloud sync: Supabase Auth + Postgres + Realtime
- Local/offline data: browser localStorage + service worker cache
- PDF reading: PDF.js in the browser
- Scanned-PDF OCR: browser-side OCR fallback
- DOCX reading: Mammoth.js in the browser
- PWA: manifest.webmanifest + versioned service worker

## Included flows
- Home, Today, Assignments, Planner and Progress
- First-run onboarding and profile
- Semester setup and unit management
- Unit outline upload/review workflow
- Assignment flow: Details → Brief → Student Understanding → Understanding Check → Custom Plan
- PDF/DOCX/TXT brief reading with file-specific brief insights and fingerprints
- Brief-specific understanding feedback rather than generic reassurance
- Editable task names, time estimates and target dates
- Task completion and growth points
- User-defined rewards that unlock at chosen point thresholds
- Optional accountability check-ins: confidence 1–10, reflection history and student-initiated email sharing
- Availability and commitments
- .ics calendar import
- Native .ics reminder export for assignment deadlines and study targets
- Focus & Recharge timer
- Optional browser notifications
- Optional email/password accounts and cross-device sync
- Password recovery, synced-data deletion and permanent account deletion
- Shared-device protection when switching between accounts
- Local data backup export/import
- Installable/offline-friendly PWA support
- Privacy-safe support diagnostics

## User data model
The app is local-first: changes are saved immediately in the browser and the planner works without an account. A student can optionally create an account. When signed in, planner state is synced to a per-user Supabase row protected by Row Level Security.

Synced planner data includes profile preferences, units, assignments, extracted brief text, brief analysis, understanding checks, custom plans, rewards, progress and optional accountability check-ins. Original uploaded assignment files are processed in the browser and are not stored by the planner.

## Academic integrity
REACH Student Planner is deliberately a planning and comprehension aid, not an assignment-generation tool. It can identify requirements in a brief and compare those requirements with the student's own explanation, but it does not generate assignment answers, paragraphs, references or citations. Students must follow the AI and academic-integrity rules for their own unit and assessment.

## Quality assurance
- `tests/smoke.mjs` validates JavaScript/PWA/security-critical production markers.
- `tests/e2e/app.spec.js` exercises onboarding, assignment planning, understanding checks, rewards, accountability, settings, mobile layouts and offline behaviour.
- GitHub Actions runs smoke and browser acceptance checks on production changes.
- Supabase RLS owner CRUD and cross-user isolation have been transaction-tested against the live project.
