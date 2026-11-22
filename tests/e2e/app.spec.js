const { test, expect } = require('@playwright/test');

const baseState = {
  name: 'Test Student',
  energy: 'steady',
  points: 0,
  focusMinutes: 15,
  breakMinutes: 10,
  recharge: 'Make tea',
  customRecharge: '',
  theme: 'light',
  notifications: false,
  calendarConnected: false,
  semester: 'Semester 1',
  units: [{ code: 'TEST1001', name: 'Test Unit', outlineConfirmed: false }],
  assignments: [],
  commitments: [],
  activity: [
    {day:'M',mins:0},{day:'T',mins:0},{day:'W',mins:0},
    {day:'T',mins:0},{day:'F',mins:0},{day:'S',mins:0},{day:'S',mins:0}
  ],
  rewards: [],
  focusHistory: [],
  onboardingComplete: true,
  accountability: { enabled: true, personName: 'Support person', email: '', history: [], pending: null },
  cloudOwnerId: '',
  schemaVersion: 3,
  lastSavedAt: new Date().toISOString(),
  lastCloudSyncAt: ''
};

async function seed(page, state = baseState) {
  await page.goto('/');
  await page.evaluate((value) => localStorage.setItem('reach-planner-v2', JSON.stringify(value)), state);
  await page.reload();
}

test('fresh user onboarding is usable and responsive', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Set up your study space.' })).toBeVisible();
  await page.locator('input[name="name"]').fill('Test Student');
  await page.locator('input[name="semester"]').fill('Semester 1');
  await page.getByRole('button', { name: /Start my planner/ }).click();
  await expect(page.getByRole('heading', { name: 'Your space to grow.' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test('assignment brief, understanding check, custom plan, accountability and reward flow', async ({ page }) => {
  await seed(page);

  await page.getByRole('button', { name: /Add assignment/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Start with the basics.' })).toBeVisible();
  await page.locator('select[name="unit"]').selectOption('TEST1001');
  await page.locator('input[name="title"]').fill('Research report');
  await page.locator('select[name="type"]').selectOption('Report');
  await page.locator('input[name="weight"]').fill('40');
  await page.locator('input[name="date"]').fill('2026-12-15');
  await page.locator('input[name="time"]').fill('17:00');
  await page.getByRole('button', { name: /Next: add the brief/ }).click();

  await expect(page.getByRole('heading', { name: /read the brief/i })).toBeVisible();
  const brief = 'Write a 1500 word report. Analyse student wellbeing and compare two support approaches. Use APA 7 and at least 8 academic sources. Include Introduction, Analysis, Recommendations and Conclusion.';
  await page.locator('textarea[name="brief"]').fill(brief);
  await expect(page.getByText(/Academic integrity:/)).toBeVisible();
  await page.getByRole('button', { name: /Read brief & continue/ }).click();

  await expect(page.getByRole('heading', { name: /What is the brief asking/i })).toBeVisible();
  await page.locator('textarea[name="understanding"]').fill('I need to write a 1500 word report analysing student wellbeing and comparing two support approaches, using APA 7 and at least 8 academic sources, with an introduction, analysis, recommendations and conclusion.');
  await page.getByRole('button', { name: /Compare with my brief/ }).click();

  await expect(page.getByRole('heading', { name: 'A clearer starting point.' })).toBeVisible();
  await expect(page.getByText(/planning check, not a grade/i)).toBeVisible();
  await page.getByRole('button', { name: /Review & customise my plan/ }).click();

  await expect(page.getByRole('heading', { name: 'Make the plan fit your life.' })).toBeVisible();
  const before = await page.locator('[data-plan-row]').count();
  await page.getByRole('button', { name: /Add my own task/ }).click();
  await expect(page.locator('[data-plan-row]')).toHaveCount(before + 1);
  const last = page.locator('[data-plan-row]').last();
  await last.locator('[data-plan-title]').fill('Check final submission requirements');
  await last.locator('[data-plan-mins]').fill('15');
  await last.locator('[data-plan-date]').fill('2026-12-14');
  await page.getByRole('button', { name: /Save assignment plan/ }).click();

  await expect(page.getByRole('heading', { name: 'Small steps. Room to breathe.' })).toBeVisible();
  await expect(page.getByText(/1500 word/i)).toBeVisible();
  await expect(page.getByText('APA 7', { exact: true })).toBeVisible();

  const checks = page.locator('button.check');
  await checks.nth(0).click();
  await expect(page.getByText(/confidence check-in is ready/i)).toBeVisible();
  await page.getByRole('button', { name: /Rate confidence/ }).click();

  await expect(page.getByRole('heading', { name: 'Pause and notice the win.' })).toBeVisible();
  await page.locator('.confidence-scale label:has(input[value="8"]) span').click();
  await page.locator('textarea[name="reflection"]').fill('I understand the first step and know what to do next.');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByText(/confidence 8\/10/i)).toBeVisible();

  await page.getByRole('button', { name: /Assignments/i }).click();
  await page.getByRole('button', { name: 'View plan' }).click();
  await page.locator('button.check').nth(1).click();
  await page.getByRole('button', { name: /Progress/i }).click();

  await page.locator('#rewardForm input[name="title"]').fill('Watch a favourite movie');
  await page.locator('#rewardForm input[name="points"]').fill('20');
  await page.getByRole('button', { name: 'Add reward' }).click();
  await page.getByRole('button', { name: 'Treat myself' }).click();
  await expect(page.getByText(/Marked as enjoyed/)).toBeVisible();
});

test('settings expose privacy, integrity, account and calendar controls', async ({ page }) => {
  const state = structuredClone(baseState);
  state.assignments = [{
    id: 999,
    unit: 'TEST1001',
    title: 'Calendar test',
    type: 'Report',
    weight: 30,
    due: '2026-12-20T17:00',
    steps: [['Read rubric', 20, false, '2026-12-18']]
  }];
  await seed(page, state);
  await page.locator('.avatar').click();

  await expect(page.getByRole('heading', { name: 'Account & sync' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Academic integrity' })).toBeVisible();
  await expect(page.getByText(/does not generate assignment answers/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Reliable reminders when the app is closed/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'System status' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Need urgent support?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Call Lifeline' })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download calendar reminders/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('REACH-Student-Planner-Reminders.ics');
});

test('mobile layout avoids horizontal overflow on key screens', async ({ page }) => {
  await seed(page);
  const screens = [
    { click: () => page.getByRole('button', { name: /Progress/i }).click(), heading: 'Look how far you’ve grown.' },
    { click: () => page.locator('.avatar').click(), heading: 'Make the planner yours.' }
  ];
  for (const s of screens) {
    await s.click();
    await expect(page.getByRole('heading', { name: s.heading })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.getByRole('button', { name: /Go home/i }).click();
  }
});

test('Chromium can reopen the previously loaded PWA shell offline', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Offline service-worker check is Chromium-only');
  await seed(page);
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return !!reg.active;
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Your space to grow.' })).toBeVisible();
  await context.setOffline(false);
});
