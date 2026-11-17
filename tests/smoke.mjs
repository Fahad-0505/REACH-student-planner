import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const fail = msg => { throw new Error(msg); };
const assert = (ok,msg) => { if(!ok) fail(msg); };

const index = read('index.html');
const wellbeing = read('wellbeing-release.js');
const release = read('release-patch.js');
const sw = read('sw.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

new Function(wellbeing);
new Function(release);

const inlineScripts = [...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1].trim())
  .filter(Boolean);
assert(inlineScripts.length >= 1, 'No inline application script found');
for (const source of inlineScripts) new Function(source);

assert(manifest.name === 'REACH Student Planner', 'Unexpected PWA name');
assert(manifest.display === 'standalone', 'PWA must use standalone display');
assert(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3, 'Expected PWA shortcuts');
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 1, 'Expected PWA icon');

for (const marker of [
  'accountabilityCheckinForm',
  'deleteAccountCompletely',
  'subscribeRealtime',
  'REACH_OCR_PDF',
  'beforeinstallprompt',
  'briefFingerprint',
  'understanding-check',
  'plan-customize'
]) assert(wellbeing.includes(marker), 'Missing production feature: '+marker);

assert(!/SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(index+wellbeing+release), 'Frontend must not contain a Supabase service-role secret');
assert(/reach-student-planner-v\d+/.test(sw), 'Service worker cache version missing');

console.log('REACH production smoke checks passed');
