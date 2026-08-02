#!/usr/bin/env node
// Rasterise a logo-design SVG set into the icon files hosts actually consume.
// Zero dependencies at rest: detects whatever converter is on the machine.
// See SKILL.md Step 6.5. Degrades to UNRUN; never blocks a run.

// D2 in the plan: routing is a rule, not a convenience. logo-favicon.svg is a
// redraw built for small sizes (reproduction.md § The favicon's own spec);
// logo-mark.svg is specified above its own computed minimum. Rasterising the
// master at 16px ships a mark this skill's reproduction layer already failed.
export const OUTPUTS = [
  { file: 'favicon-16.png', size: 16, source: 'logo-favicon.svg' },
  { file: 'favicon-32.png', size: 32, source: 'logo-favicon.svg' },
  { file: 'favicon-48.png', size: 48, source: 'logo-favicon.svg' },
  { file: 'favicon.ico', source: 'logo-favicon.svg', pack: [16, 32, 48] },
  { file: 'apple-touch-icon.png', size: 180, source: 'logo-mark.svg' },
  { file: 'icon-192.png', size: 192, source: 'logo-mark.svg' },
  { file: 'icon-512.png', size: 512, source: 'logo-mark.svg' },
  { file: 'icon-1024.png', size: 1024, source: 'logo-mark.svg' },
];
