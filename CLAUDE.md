# superpowers-extensions

- New plugin: run `npm run check:registries`. It names every registry file the plugin must appear in.
- New commit scope: add it to the scope-enum in `commitlint.config.js` in the same commit. The commit-msg hook (installed by `npm install`) runs commitlint.
- Specs go in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`. Commit them as `docs(design)` and `docs(plan)`.
- Before pushing: `npm run lint:md && npm run check:registries && npm run check:conventions && npm test`.
