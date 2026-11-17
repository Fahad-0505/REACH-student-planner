# REACH Student Planner

A mobile-first student planning and study-wellbeing web application developed for REACH ADHD Coaching & Consultancy.

## Live app
https://reach-student-planner-final-v4.onrender.com

## Purpose
The planner helps students reduce overwhelm by turning assessment requirements into manageable steps, planning study around real-life commitments, using short focus blocks, recognising progress positively, and choosing meaningful self-rewards.

## Current production stack
- Frontend: dependency-light HTML, CSS and JavaScript
- Hosting/CDN: Render Static Site
- Source control: GitHub
- Accounts and cloud sync: Supabase Auth + Postgres
- Local/offline data: browser localStorage + service worker cache
- PDF reading: PDF.js in the browser
- DOCX reading: Mammoth.js in the browser
- PWA: manifest.webmanifest + sw.js

## Included flows
- Home, Today, Assignments, Planner and Progress
- Semester setup and unit management
- Unit outline upload/review workflow
- Assignment flow: Details → Brief → Student Understanding → Understanding Check → Custom Plan
- Local PDF/DOCX/TXT brief reading with file-specific brief insights
- Brief-specific understanding feedback
- Editable task names, time estimates and target dates
- Task completion and growth points
- User-defined rewards that unlock at chosen point thresholds
- Availability and commitments
- .ics calendar import
- Focus & Recharge timer
- Profile/settings
- Optional account creation, sign-in and cross-device cloud sync
- Password recovery and user-controlled local/cloud planner deletion
- Shared-device protection when switching between different accounts
- Optional accountability check-ins with 1–10 confidence rating, reflection history and student-initiated email sharing
- Local data backup export/import
- Scanned-PDF OCR fallback in the browser
- Installable/offline-friendly PWA support with install guidance and offline status

## User data model
The app remains local-first: changes are saved immediately in the browser so the planner works without an account. Students can optionally create an account with email and password. When signed in, the planner state is synced to Supabase in a per-user row protected by Row Level Security.

Synced planner data includes profile preferences, units, assignments, extracted brief text, brief analysis, understanding checks, custom plans, rewards, progress and optional accountability check-ins. The original uploaded assignment file is processed in the browser and is not stored in Supabase.

No real student data is bundled with the repository. Demo content is fictional.

## Academic integrity
The planner assists students to understand, organise and plan academic work. It does not write assignments.
