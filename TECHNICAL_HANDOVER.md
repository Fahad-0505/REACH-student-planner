# Technical handover

## Production deployment
- Host: Render Static Site
- URL: https://reach-student-planner-final-v4.onrender.com
- Source repository: https://github.com/Fahad-0505/REACH-student-planner
- Branch: main
- Deployment model: static HTML/CSS/JavaScript
- PWA files: manifest.webmanifest, sw.js
- Brand asset: assets/favicon.svg

## Architecture
The release is deliberately local-first and dependency-light for handover reliability. Application state is stored in browser localStorage under the REACH planner key. A service worker caches the core shell after first successful load.

## Functional modules
1. Main navigation: Home, Today, Assignments, Planner, Progress
2. Assignment planning wizard
3. Semester and unit setup
4. Unit-outline review flow
5. Availability / recurring commitments
6. Calendar import using .ics
7. Focus timer and configurable rhythm
8. Progress / growth points
9. Settings and backup/export/import

## Important boundary
Uploaded unit-outline and assignment files are not transmitted to a backend in this release. File names may be retained locally and students can paste key instructions for planning. The application does not claim to perform automatic PDF extraction or AI assignment writing.

## Privacy
No real client/student records should be committed to the repository. The current demo data is fictional.

## Future enhancement path
A future developer can add authenticated cloud sync using the existing Supabase project, but the current release does not depend on it to operate.