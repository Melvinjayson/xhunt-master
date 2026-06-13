import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/xhunt-screenshots';

const SEED_STATE = JSON.stringify({
  user: {
    interests: ['adventure', 'mindfulness', 'food'],
    goals: ['explore'],
    onboardingComplete: true,
  },
  hunts: [
    {
      id: 'hunt-urban-archaeologist',
      title: 'The Urban Archaeologist',
      story_context: 'Your city holds ancient secrets waiting to be uncovered. Every street corner is a page in a living history book, and most people walk past them without a second glance.',
      difficulty: 'medium',
      estimated_time: '45 min',
      steps: [
        { id: 1, type: 'action', instruction: 'Find the oldest building within a 10-minute walk of where you are right now. Photograph its architecture.', success_criteria: 'You have a photo and an approximate age for the building.' },
        { id: 2, type: 'discovery', instruction: "Look for a hidden alley or passage you've never noticed. Step inside.", success_criteria: "You found and entered a space you've overlooked before." },
        { id: 3, type: 'action', instruction: "Find someone who has lived here 10+ years. Ask: what's something most people miss about this place?", success_criteria: 'You had a genuine conversation and learned something new.' },
        { id: 4, type: 'reflection', instruction: 'Write down the most surprising thing you discovered today.', success_criteria: 'You wrote at least 3 sentences.' },
      ],
      reward: 'Urban Pioneer Explorer Badge + 150 XP',
      tags: ['adventure', 'city', 'history', 'discovery'],
    },
    {
      id: 'hunt-morning-ritual',
      title: 'The Morning Ritual',
      story_context: 'Dawn holds a quiet power most people sleep through. The first hour of your day is a blank page.',
      difficulty: 'easy',
      estimated_time: '30 min',
      steps: [
        { id: 1, type: 'action', instruction: 'Before checking your phone, step outside for 60 seconds.', success_criteria: 'You went outside before any screen.' },
        { id: 2, type: 'reflection', instruction: 'Spend 3 minutes observing. Notice one sound, one smell, one sensation.', success_criteria: 'You stayed present for 3 full minutes.' },
        { id: 3, type: 'action', instruction: 'Make a warm drink slowly. No multitasking.', success_criteria: 'You made and drank it without doing anything else.' },
        { id: 4, type: 'reflection', instruction: "Write 3 things you're genuinely grateful for. Be specific.", success_criteria: 'You wrote three specific things.' },
      ],
      reward: 'Dawn Wanderer Mindfulness Badge + 80 XP',
      tags: ['mindfulness', 'morning', 'habits', 'calm'],
    },
    {
      id: 'hunt-creative-spark',
      title: 'The Creative Spark',
      story_context: "Creativity is a muscle most people stop exercising after childhood. Today, you pick it back up.",
      difficulty: 'medium',
      estimated_time: '60 min',
      steps: [
        { id: 1, type: 'action', instruction: "Find any creative medium you haven't used in months.", success_criteria: 'You have a medium in your hands.' },
        { id: 2, type: 'action', instruction: 'Create something for 15 minutes without stopping or judging.', success_criteria: 'You created for 15 uninterrupted minutes.' },
        { id: 3, type: 'reflection', instruction: 'Give your creation a title and write one sentence about what you expressed.', success_criteria: 'Your creation has a title and stated intention.' },
        { id: 4, type: 'action', instruction: "Share your creation with one person.", success_criteria: 'One other person has seen your creation.' },
      ],
      reward: 'Creative Awakening Expression Badge + 130 XP',
      tags: ['creativity', 'art', 'expression', 'making'],
    },
  ],
  progress: {
    'hunt-urban-archaeologist': {
      huntId: 'hunt-urban-archaeologist',
      currentStepIndex: 1,
      completedSteps: [1],
      startedAt: new Date().toISOString(),
    },
  },
  completedHunts: [
    {
      huntId: 'hunt-morning-ritual',
      huntTitle: 'The Morning Ritual',
      reward: 'Dawn Wanderer Mindfulness Badge + 80 XP',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  streak: 1,
});

async function shot(page, name) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`✓ ${name}`);
}

async function seedAndGo(page, url) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((state) => localStorage.setItem('xhunt_v1', state), SEED_STATE);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  // 1. Onboarding — welcome
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot(page, '01-onboarding');

  // 2. Onboarding — interests selected
  for (const label of ['Adventure', 'Mindfulness', 'Food & Drink']) {
    const btn = page.locator('button').filter({ hasText: label }).first();
    if (await btn.isVisible()) await btn.click();
  }
  await page.waitForTimeout(400);
  await shot(page, '02-onboarding-interests');

  // 3. Onboarding — goals page
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(500);
  await shot(page, '03-onboarding-goals');

  // 4. Home feed
  await seedAndGo(page, `${BASE}/home`);
  await shot(page, '04-home-feed');

  // 5. Hunt detail
  await seedAndGo(page, `${BASE}/hunt/hunt-urban-archaeologist`);
  await shot(page, '05-hunt-detail-top');

  // 6. Hunt detail — scrolled to steps
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(300);
  await shot(page, '06-hunt-detail-steps');

  // 7. Active hunt — step 2
  await seedAndGo(page, `${BASE}/active/hunt-urban-archaeologist`);
  await shot(page, '07-active-hunt');

  // 8. Skip sheet
  await page.click('button:has-text("Skip this step")');
  await page.waitForTimeout(600);
  await shot(page, '08-skip-adapt-sheet');

  // Close sheet by clicking backdrop
  await page.mouse.click(195, 200);
  await page.waitForTimeout(400);

  // 9. Explore
  await seedAndGo(page, `${BASE}/explore`);
  await shot(page, '09-explore');

  // 10. Profile
  await seedAndGo(page, `${BASE}/profile`);
  await shot(page, '10-profile');

  await browser.close();
  console.log(`\nAll screenshots in ${OUT}/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
