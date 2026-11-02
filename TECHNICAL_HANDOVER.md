# Technical handover

## Production deployment
- Host: Render Static Site
- URL: https://reach-student-planner-final-v4.onrender.com
- Source repository: https://github.com/Fahad-0505/REACH-student-planner
- Branch: main
- Deployment model: static HTML/CSS/JavaScript
- PWA files: manifest.webmanifest, sw.js
- Brand asset: assets/favicon.svg

## Platform architecture
1. **Browser / PWA**
   - Runs the complete student-facing application.
   - Saves working state immediately in localStorage under the REACH planner key.
   - Uses a service worker for install/offline resilience.
   - Reads PDF, DOCX and TXT assignment files locally in the browser.

2. **GitHub**
   - Stores production source and handover documentation.

3. **Render**
   - Serves the static production build over HTTPS/CDN.
   - Production service: `reach-student-planner-final-v4`.

4. **Supabase**
   - Auth: optional email/password student accounts and password recovery.
   - Database: `public.planner_state` stores one JSONB planner document per authenticated user.
   - Security: Row Level Security restricts each student to their own `user_id` row.
   - The frontend uses the Supabase publishable key only; no service-role secret is shipped to the browser.

## Data behaviour
The app is local-first. A student can use the planner without creating an account. When signed in, saves are also synced to Supabase.

The synced planner document can contain:
- profile name and semester
- preferences and focus/recharge settings
- units and confirmed unit-outline information
- assignments and due dates
- extracted assignment-brief text and file name
- file-specific brief analysis
- the student's own understanding and comparison result
- editable task breakdown, time estimates and target dates
- commitments and planning data
- growth points, rewards and progress

The original uploaded assignment file itself is **not uploaded or retained**. It is read locally and only the extracted text/planning metadata is saved.

## Assignment brief flow
1. Student creates assignment details.
2. Student uploads PDF/DOCX/TXT or pastes instructions.
3. Browser extracts readable text.
4. App records a brief fingerprint, extracted character count and file name so the student can verify which document was read.
5. App identifies deliverable, task verbs, length, referencing, source requirements, structure, key topics and brief-specific instructions.
6. Student explains the task in their own words.
7. Understanding is compared against the detected requirements and key instructions.
8. Student reviews and edits the proposed task plan, minutes and target dates before saving.

Scanned/image-only PDFs still require pasted text because OCR is not bundled into this release.

## Functional modules
1. Main navigation: Home, Today, Assignments, Planner, Progress
2. Assignment planning wizard
3. Semester and unit setup
4. Unit-outline review flow
5. Availability / recurring commitments
6. Calendar import using .ics
7. Focus timer and configurable rhythm
8. Progress / growth points / user-defined rewards
9. Settings, optional account sync, password recovery, backup/export/import
10. Local/cloud data controls

## Wellbeing design boundary
The product is a planning and study-wellbeing aid, not a diagnostic, counselling, medical or emergency service. Planning remains editable and non-punitive; students can change task size, timing and rewards without losing previously claimed rewards.

## Privacy and security
- No real client/student records should be committed to the repository.
- Demo data is fictional.
- Supabase `planner_state` has RLS enabled.
- Authenticated policies restrict SELECT/INSERT/UPDATE/DELETE to rows where `auth.uid() = user_id`.
- Uploaded source files stay in the browser rather than being sent to a third-party AI service.
