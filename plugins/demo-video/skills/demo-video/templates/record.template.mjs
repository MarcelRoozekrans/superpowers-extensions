// Storyboard for this demo video. Fill in `chapters`, then run: node record.mjs
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { record } from './lib/runtime.mjs';

// Example chapter, using every helper:
//
// {
//   title: 'Start an analysis',
//   steps: [
//     {
//       caption: 'Open the app',
//       run: (h) => h.goto('/'),
//       expect: (h) => h.expectText(h.page.locator('h1'), 'Welcome'),
//     },
//     {
//       caption: 'Type a name and paste a long text',
//       run: async (h) => {
//         await h.type(h.page.getByLabel('Name'), 'Ada');
//         await h.paste(h.page.getByLabel('Notes'), 'A long text that is pasted instead of typed.');
//       },
//     },
//     {
//       caption: 'Run the analysis',
//       run: (h) => h.click(h.page.getByRole('button', { name: 'Analyse' })),
//       waitFor: (h) => h.expectText(h.page.locator('#result'), 'Done'),
//     },
//   ],
// },
// {
//   title: 'Open the dashboard',
//   steps: [
//     {
//       caption: 'Open the dashboard in a second tab',
//       run: (h) => h.openTab('dashboard', '/dashboard'),
//       expect: (h) => h.expectText(h.page.locator('h1'), 'Dashboard'),
//     },
//     { caption: 'Back to the first tab', run: (h) => h.switchTab('main') },
//   ],
// },

await record({
  folder: dirname(fileURLToPath(import.meta.url)),
  baseUrl: 'http://localhost:3000',
  mode: 'polished',
  // title: 'Video title',
  // endCard: 'End card line',
  // captions: false,
  // The app's language, from the storyboard. Without it the browser renders in English.
  // locale: 'nl-NL',
  // timezoneId: 'Europe/Amsterdam',
  // contextOptions: { colorScheme: 'light' },
  // A silent login, run before recording starts. It is not part of the video.
  // setup: async (h) => {
  //   await h.goto('/login');
  //   await h.page.getByLabel('Email').fill('demo@example.com');
  //   await h.page.getByLabel('Password').fill('demo-password');
  //   await h.page.getByRole('button', { name: 'Sign in' }).click();
  //   await h.expectText(h.page.locator('h1'), 'Welcome');
  // },
  // Or reuse a saved login, a path relative to this folder. Keep it in the gitignored .auth/.
  // storageState: '.auth/state.json',
  // Timings in ms: mouseSteps, beforeClick, keyDelay, reading, readingAfterWait,
  // expectTimeout (checks) and waitTimeout (waitFor).
  // pace: { waitTimeout: 180000 },
  // Slow waits play at speedFactor times, but never shorter than minWait seconds.
  // speedFactor: 10,
  // minWait: 1,
  chapters: [],
});
