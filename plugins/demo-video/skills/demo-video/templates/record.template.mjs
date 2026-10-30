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
  chapters: [],
});
