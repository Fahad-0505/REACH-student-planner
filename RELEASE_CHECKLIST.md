# REACH Student Planner — Release Acceptance Checklist

Use this checklist before handing a release to REACH clients.

## Accounts & privacy
- [ ] Fresh install opens with no demo profile, points, assignments or units.
- [ ] Create Account works and confirmation email is received.
- [ ] Sign in loads the correct user's cloud planner.
- [ ] Two different accounts on the same device never silently inherit each other's retained local planner.
- [ ] Password reset completes successfully.
- [ ] Sign out keeps local data only when expected.
- [ ] Sign out & clear removes the local device copy.
- [ ] Delete synced planner data works.
- [ ] Permanently delete account works.
- [ ] Supabase RLS/security advisor checked.
- [x] Leaked-password advisory reviewed. Feature is Pro+; current Free-plan release uses 12+ character mixed password validation instead.

## Cross-device sync
- [ ] Device A changes profile/assignment/reward.
- [ ] Device B signed into the same account receives the updated planner.
- [ ] Newer local data conflict shows a choice instead of silently overwriting.
- [ ] Offline changes remain local and sync after reconnecting.

## Units & assignments
- [ ] Add unit manually.
- [ ] Upload a text PDF unit outline and review detected assessments.
- [ ] Upload a scanned PDF and confirm OCR fallback.
- [ ] Upload DOCX/TXT assignment brief.
- [ ] Two different briefs produce different brief insights/fingerprints.
- [ ] Word count, referencing, deliverable and action words are parsed when present.
- [ ] Weak understanding receives corrective feedback.
- [ ] Strong brief-matched understanding receives positive/specific feedback.
- [ ] Student can edit/add/remove plan tasks, minutes and target dates.
- [ ] Target dates appear in Planner.
- [ ] Deleting an assignment does not remove previously earned growth points.

## Focus, wellbeing & progress
- [ ] Low/steady/high energy changes suggested focus duration.
- [ ] Focus timer start/pause/resume/reset all work.
- [ ] Focus phase transitions to configured recharge phase.
- [ ] Completed focus session is recorded.
- [ ] User-created reward unlocks at chosen point threshold.
- [ ] Claiming a reward does not subtract growth points.
- [ ] Active/Completed assignment filters work.

## Accountability
- [ ] Enable accountability in Settings.
- [ ] Save nominated support person's name/email.
- [ ] Completing an assignment step queues a check-in.
- [ ] Confidence 1–10 can be selected.
- [ ] Optional reflection is saved.
- [ ] Recent check-ins appear in Progress.
- [ ] Email my win opens a pre-filled draft to the configured recipient.
- [ ] Nothing is emailed automatically.

## PWA/mobile/offline
- [ ] App can be installed on supported Chrome/Edge/Android devices.
- [ ] iPhone/iPad Add to Home Screen guidance is understandable on a physical iOS device.
- [ ] Installed app opens in standalone mode.
- [ ] Previously loaded app reopens offline.
- [ ] Offline status is visible.
- [ ] Navigation fallback works offline without returning HTML for failed image/script requests.
- [ ] Automated mobile WebKit/Chromium layout checks pass; do one final visual spot-check on REACH's physical phone/tablet.
- [ ] Keyboard focus indicators visible.
- [ ] Reduced-motion preference respected.

## Handover
- [ ] Final Render deployment commit matches GitHub `main`.
- [ ] GitHub Actions smoke check passes.
- [ ] REACH has ownership/access to GitHub, Render and Supabase.
- [ ] Final public domain decision recorded.
- [ ] Privacy/terms/support wording approved by REACH.
- [ ] Branded auth email decision recorded.
- [x] AI decision recorded: no external generative AI in v1; planning/comprehension support only.
- [x] Closed-app reminder decision recorded: native calendar (.ics) export is the reliable cross-platform fallback.
- [x] Render deployment fallback recorded because Git push auto-deploy is not firing reliably.
- [x] Supabase Free-plan pause risk documented.
