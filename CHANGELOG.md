# Changelog

## [1.15.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.14.3...superpowers-extensions-v1.15.0) (2026-05-05)


### Features

* **project-orchestration:** design spec templates for roadmap/milestone/phase ([69b6ced](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/69b6cede0a1988da601319e6f15e6f3b9c109d0b))
* **project-orchestration:** surface-based dispatch (auto-chain ui-workflow / refactor-analysis) ([e6adee0](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/e6adee0cf3548d92be6c4731a97c5227e75392bb))
* **project-orchestration:** surface-based pre-plan hook in start-next-phase ([d42a354](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/d42a35406d69321f49c444adcb015efa6afe975c))


### Bug Fixes

* **project-orchestration:** wrap template placeholders in backticks for markdownlint MD033/MD032 ([dbd2cfc](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/dbd2cfc235378f3b279d59c7e9c1006fbfb4f133))

## [1.14.3](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.14.2...superpowers-extensions-v1.14.3) (2026-05-05)


### Bug Fixes

* **project-orchestration:** make plan-roadmap discoverable on greenfield projects and reinforce roadmap-scope brainstorming ([4b48b78](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/4b48b78abc20e4b4fde1cb093bbfbe3d3699521f))
* **project-orchestration:** plan-roadmap discoverable on greenfield + roadmap-scope guard ([b91ce9e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/b91ce9ee88fc3897d74065c93a0e5c197de774c3))

## [1.14.2](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.14.1...superpowers-extensions-v1.14.2) (2026-05-04)


### Bug Fixes

* **project-orchestration:** post-compaction discipline (closes [#77](https://github.com/MarcelRoozekrans/superpowers-extensions/issues/77)) ([0d99b1b](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0d99b1b2c8617471d0361e2123cb9c244b64ddb9))
* **project-orchestration:** post-compaction discipline so resume-work fires after auto-compaction ([62388ee](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/62388eeb42685350a486a579194197e27d880f48))

## [1.14.1](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.14.0...superpowers-extensions-v1.14.1) (2026-05-04)


### Bug Fixes

* **project-orchestration:** add complete-phase so ROADMAP.md updates per iteration ([adaca0e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/adaca0ecc9eb4f9b178834219d4f0a55afbc0638))
* **project-orchestration:** add complete-phase sub-skill so ROADMAP.md updates per iteration ([a2791f4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a2791f45f088047f80200c7f15d469c880530697))
* **squad:** make squad-sync explicitly consume [new-decision] markers from subagents ([e60569c](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/e60569c9d75d1d699b1fe2ec166701b860a4a794))

## [1.14.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.13.0...superpowers-extensions-v1.14.0) (2026-05-04)


### Features

* **squad:** replace in-context persona model with parallel Task subagent dispatch ([9a8c679](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/9a8c6795437aedb893f5412977c1d1d2d9645443))
* **squad:** replace in-context persona model with parallel Task subagent dispatch ([8664e9c](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/8664e9cb82af902929da8440870fd2869fa39320))

## [1.13.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.12.0...superpowers-extensions-v1.13.0) (2026-05-04)


### Features

* **suite:** multi-provider support — cursor, codex, gemini, copilot cli, opencode ([4622903](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/4622903c678de8b12435b5b7592826f30f5cfc7f))
* **suite:** phase 1 multi-provider — cursor and codex manifests + polymorphic session-start hook ([62c9d73](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/62c9d73a4d9d4e91faa1bc2cced6305afde2c805))
* **suite:** phase 2 multi-provider — gemini, opencode, and copilot cli integrations ([2c43944](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/2c439448936de64d44e8565886dd2375fc906fd5))

## [1.12.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.11.4...superpowers-extensions-v1.12.0) (2026-05-04)


### Features

* **ui-design-system:** scheduled workflow to refresh design system catalog from upstream ([0b09c4e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0b09c4ea38569e1f265ae425d1be83f775102e81))
* **ui-design-system:** vendor 70-system catalog, curated mode, 7-question form, and design directions ([4c1c2db](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/4c1c2dbe04e763376b57c4ffd72f3cc8622496f6))
* **ui-workflow:** add anti-slop scan and 5-dimension critique to ui-review ([52460f1](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/52460f1e50f0d11fb171fa2fb25deab5f98ae32f))
* **ui:** vendor 70 design systems, add critique pipeline inspired by open-design ([ef9e7e7](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ef9e7e770ff9edd2ca66a46341275ccd2bf55406))

## [1.11.4](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.11.3...superpowers-extensions-v1.11.4) (2026-05-03)


### Bug Fixes

* **deps:** include squad in release-please version bumps ([49e6fd8](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/49e6fd81275a6e620d8e027eb6c4451f9cdc2940))
* **deps:** include squad in release-please version bumps ([2048bbf](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/2048bbf759b6d08053de04994e317be84e89534d))

## [1.11.3](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.11.2...superpowers-extensions-v1.11.3) (2026-05-02)


### Bug Fixes

* **project-orchestration:** enforce disk writes and add brainstorm-first milestone planning ([0952d57](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0952d5757068194e81fa2b1ece6e6334bfa87887))
* **project-orchestration:** enforce disk writes and brainstorm-first milestone planning ([ebfac1d](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ebfac1d1690ddd2e64125304e64dca29393f88ce))

## [1.11.2](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.11.1...superpowers-extensions-v1.11.2) (2026-05-01)


### Bug Fixes

* **project-orchestration:** chain resume-work to start-next-phase routing hub ([acf9c92](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/acf9c923745872c6a6626becdfae3237b0cc0edd))
* **project-orchestration:** chain resume-work to start-next-phase routing hub ([a917b74](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a917b74bcecc35bdd1e746d14a148e5d59895455)), closes [#58](https://github.com/MarcelRoozekrans/superpowers-extensions/issues/58)

## [1.11.1](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.11.0...superpowers-extensions-v1.11.1) (2026-03-26)


### Bug Fixes

* **squad:** address post-merge review findings ([b608f39](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/b608f39bb6bd29c036bea08f60fc06ce6054d28a))
* **squad:** address post-merge review findings ([ae908de](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ae908de10143ee3ccdd678d1a9cc3ae82955b3b3))

## [1.11.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.10.0...superpowers-extensions-v1.11.0) (2026-03-25)


### Features

* **squad:** add default agent charter files (lead, backend, frontend, tester, scribe) ([2491687](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/249168782ee857df74beb8551416c433cf760ccd))
* **squad:** add main SKILL.md with routing, tiered lookup, sub-skills, and integrations ([3d7f4b4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/3d7f4b4d5718cae9e47ec4fe48e0f5db38d3daf9))
* **squad:** add routing-rules and history-format reference files ([f374da1](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/f374da12769b999eb6e170d9bb41d889c851b46a))
* **squad:** add squad plugin with persistent AI agent teams ([7d5cf81](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/7d5cf81f085864dfd41af7689e85582659a82047))
* **squad:** register squad plugin in marketplace (v1.10.0) ([b81012f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/b81012fef2a6cdb31b044e2347406f5acf4db85a))
* **squad:** scaffold plugin directory and plugin.json ([5b65079](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/5b65079b3e30f02ea49f4e062be5690c8ef09f79))


### Bug Fixes

* **squad:** add blank lines around headings and lists to pass markdownlint ([d2e7f06](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/d2e7f06fe738551586b4aed51a603f401e67aff2))
* **squad:** add language specifier to squad-status code block ([cb7bb44](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/cb7bb44bf4a6149210929cf0db48caa2a22b7319))
* **squad:** add language specifiers to code blocks and blank lines around lists ([56b93f5](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/56b93f54f4a33f1dabc05d3c459dc1f8463afc65))

## [1.10.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.9.0...superpowers-extensions-v1.10.0) (2026-03-20)


### Features

* **marketplace:** add install-plugins npm script ([925b982](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/925b9828919088292da3057d4d958e660ba8b7df))


### Bug Fixes

* **deps:** add Renovate config and skip commitlint for bot PRs ([8cefe11](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/8cefe11e59171be177afcf5321f2aba583b6d156))
* **deps:** add Renovate config with semantic commits ([353edda](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/353edda1a5e0b3c17cbbd156667c8590f43642d6))
* **deps:** skip commitlint for bot PRs ([bc7aba4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/bc7aba43672e3c9d80d18f203d2032c330d5b460))
* **deps:** skip commitlint for github-actions[bot] PRs ([15282c8](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/15282c80db519968c7ec2cee7f4671e7efe945ce))
* **deps:** skip commitlint for release-please branches ([5421ebb](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/5421ebbb52b57ce94891dc221d2107099a50d6ba))
* **deps:** skip commitlint for release-please branches ([b39d357](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/b39d357d1aed3c5d3516378d9fdbabd216741599))

## [1.9.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.8.0...superpowers-extensions-v1.9.0) (2026-03-20)


### Features

* **marketplace:** add install-plugins npm script ([de6ef5f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/de6ef5fbb07fa495a5adbce01a52bd1077b8e468))
* **marketplace:** add install-plugins npm script to install all plugins at once ([e922e80](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/e922e809d9ddccaddf05dc8d319827d435687232))

## [1.8.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.7.0...superpowers-extensions-v1.8.0) (2026-03-20)


### Features

* **ui-design-system:** add admin domain rules ([f066b3a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/f066b3a98d8c52650ca4ca6a0fd873374cfa5bac))
* **ui-design-system:** add blazor stack rules ([a5cc859](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a5cc8597e58fd8a278b97a65e6579d555945d30d))
* **ui-design-system:** add design system generation plugin + suite quality fixes ([0c94bbd](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0c94bbd57b69406380cc23ca7537c2a973aded84))
* **ui-design-system:** add generic-web fallback stack rules ([c55434a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c55434a6fd43cda45991ecb201ef7b054aacd489))
* **ui-design-system:** add main skill file ([911a66e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/911a66e9f264aa70996ca11e4d9f9f0266b9d19e))
* **ui-design-system:** add marketing domain rules ([612ec13](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/612ec13def2aec0bff627bedc442ab7e2fa72cd4))
* **ui-design-system:** add react stack rules ([081b0b8](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/081b0b8dca30b8d7457870e755dd6b231cbf8546))
* **ui-design-system:** add saas domain rules ([4ddf5b8](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/4ddf5b899e0a26edcb707157000107b65ade1a66))
* **ui-design-system:** add vue and astro stack rules ([d548f31](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/d548f316b0c8541f11ea630f5197417c9eef6f88))
* **ui-design-system:** scaffold plugin ([cd3d0fb](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/cd3d0fb1338a6231ba71336aa0395b98239c2d0b))
* **ui-workflow:** auto-detect MASTER.md from ui-design-system in ui-phase ([3467fbe](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/3467fbe5b8828e838de6c984c1b64f356a284663))


### Bug Fixes

* **deps:** add suite and readme scopes, fix markdownlint errors in ui-design-system files ([fda04c4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/fda04c421edfae08a2045246fa69ed05ff938492))
* **deps:** extend release-please config to bump all 9 plugin versions ([96d957c](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/96d957c94f6983efe60c218c3fe36c00c18f32b5))
* **deps:** extend release-please config to bump all 9 plugin versions ([3738bb9](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/3738bb92a6a82b81e53c502fae6b4e7cc95a6525))
* **suite:** address full suite review findings ([c39e54a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c39e54a81c31bf4f7438e030082871cbe08ddf5c))
* **ui-design-system:** register in marketplace, commitlint, fix README guided mode description ([db558b7](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/db558b742c56b88db24381278ab4ac848a712a4d))

## [1.7.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.6.0...superpowers-extensions-v1.7.0) (2026-03-18)


### Features

* add project-orchestration and ui-workflow plugins (GSD integration) ([e9dd78c](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/e9dd78c6536bb2e22ebe9c4c5dcbcc2d610340d8))
* **marketplace:** add project-orchestration and ui-workflow plugins v1.6.0 ([ba294e8](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ba294e816a9f1623fae6cf62553f680453b4dd0d))
* **project-orchestration:** add SKILL.md with all sub-skills ([acebe89](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/acebe899979e3f3df95d8b898cfb4cd3350d0cb0))
* **project-orchestration:** add state-files reference doc ([563a791](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/563a7916c109af5a1560c8727b83caeab3965f9c))
* **project-orchestration:** scaffold plugin structure ([c7ca1ce](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c7ca1cecf3c9560822282a9a6eaa345b69afefa5))
* **ui-workflow:** add SKILL.md with ui-phase and ui-review ([c81452a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c81452a7cb5cd701e2ba7eacc4edb84c20c6fdb7))
* **ui-workflow:** add ui-contract template ([6994a5a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/6994a5a65b78b4a2cf5c03eb31d83cf0d49fedc8))
* **ui-workflow:** scaffold plugin structure ([ee7b702](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ee7b7022466a172e64a51eb48fb920b118d5181b))


### Bug Fixes

* **deps:** add plan and design to commitlint scope-enum ([297b805](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/297b805b6b6e0e707c2079bddf43234b4b053342))
* **deps:** fix commitlint scopes and markdownlint errors for new plugins ([198dd64](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/198dd64c058ee480673c3e13c6bf12d5ac18ae4f))
* **marketplace:** update top-level description to include new plugins ([63ffd31](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/63ffd311cf3b7b67f6ce671c818170a3e83b0cd5))
* **project-orchestration:** align plugin.json to existing schema (name/description/author only) ([3230e28](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/3230e285ce6f5a86340e5cbf58b396a235ae226c))
* **project-orchestration:** fix SKILL.md — commit before tag, consistent filename, decision-tracker in resume-work ([d4156fc](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/d4156fc5b1036fc29cea6ee8536b9c0bc6ab35d4))
* **project-orchestration:** fix state-files — add pending status, completion dates ([5f14053](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/5f140538ace92480678e44e661ce0cdb96edac29))
* **project-orchestration:** move state files from .planning/ to docs/planning/ to align with superpowers docs/ convention ([0d65c04](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0d65c0493aad17700912e92544681669af43c460))
* **project-orchestration:** use explicit git add in complete-milestone, handle missing STATE.md in progress ([d78a934](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/d78a9341cc5ea831a9ebbca280b71f0d234387f7))
* **ui-workflow:** add multi-component repetition cue to ui-contract template ([276fb95](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/276fb95d362aa64e3e74198abd85d80f430ca4c6))
* **ui-workflow:** fix SKILL.md — sub-skills bridging, design-doc fallback, ui-review commit step ([78ff86f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/78ff86fc0706a7c366f02567eac448ef43b4078c))

## [1.6.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.5.0...superpowers-extensions-v1.6.0) (2026-03-13)


### Features

* **decision-tracker:** automate stale validation with search_by_date_range ([44b87eb](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/44b87ebcbfd558356005dcabfa7d875b8edc9859))
* **memorylens-integration:** add brainstorming integration section and update relationship table ([815ad52](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/815ad526f8cc5a952b9e715229c777aaafa383a9))
* **roslyn-codelens-integration:** add list_solutions, set_active_solution, promote rebuild_solution ([0bd4313](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0bd431378a1bb0830fa472fea5e2a6bcee141108))
* sync integration skills with dependent repos (roslyn +3 tools, memorylens brainstorming, decision-tracker stale validation) ([c79abcf](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c79abcfd9500f5b77781a9e24c548731e9060395))


### Bug Fixes

* **decision-tracker:** clarify search_by_date_range usage and add graceful degradation ([99f4823](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/99f4823229ec8967588c08ef0250d15812d27731))

## [1.5.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.4.0...superpowers-extensions-v1.5.0) (2026-03-09)


### Features

* add memorylens-integration plugin ([0fab7d1](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0fab7d1dd2563140a8fe9c0d2df30f7f7bd41068))
* **memorylens-integration:** add main skill for debugging phase integration ([9469f0a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/9469f0a3276cccb3a0dac4478c6c22a7d7b36cbd))
* **memorylens-integration:** add plugin manifest and MCP auto-config ([31d8e7e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/31d8e7ec856bfd109b5cbf69b44a0ff6189a471e))
* **memorylens-integration:** register plugin in hub marketplace and commitlint ([ac71809](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ac718090fc65037470a0ed4bcc30c886568aea3d))


### Bug Fixes

* **memorylens-integration:** add blank lines around lists for MD032 compliance ([934da8a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/934da8ab588fa253dd03de12a878523964a4c773))

## [1.4.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.3.2...superpowers-extensions-v1.4.0) (2026-03-08)


### Features

* **roslyn-codelens-integration:** add MCP server and map all 21 tools ([d07b1fa](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/d07b1fa93d96b07df6e21d4e4b61f0626d3e0908))
* **roslyn-codelens-integration:** add MCP server config and update skill for all 21 tools ([1d506aa](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/1d506aa0f650fb2d46155a10fbe1087aaf98a301))

## [1.3.2](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.3.1...superpowers-extensions-v1.3.2) (2026-03-07)


### Bug Fixes

* **deps:** depend on obra/superpowers instead of superpowers-marketplace ([4b42ec4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/4b42ec491c9525678d377e23f1f7f177889b9de7))

## [1.3.1](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.3.0...superpowers-extensions-v1.3.1) (2026-03-07)


### Bug Fixes

* sync plugin versions to repo version and auto-bump on release ([6ea058d](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/6ea058d4134e586a1d9308c894e34e94875d72c3))
* sync plugin versions to repo version and auto-bump on release ([520bf3d](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/520bf3d67f8afe469fdfe8d97d3ec2559a7613b8))
* sync plugin versions to repo version on release ([eea504f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/eea504fdf3c835802e4cd7bc386eaa99f73f49c0))

## [1.3.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/superpowers-extensions-v1.2.0...superpowers-extensions-v1.3.0) (2026-03-06)


### Features

* add .mcp.json files for decision-tracker and roslyn-codegraph-integration ([a413413](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a41341326cedb7d36cf9b58bfa1c94c24e147dc0))
* add conventional commits enforcement and semantic versioning ([a75ad50](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a75ad5045406b903d98dcfde8ad7d7d6696446e3))
* add decision-tracker plugin and upgrade to ecosystem hub ([7f913b4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/7f913b44ac3793538985f1ae3ba8561c30dfece5))
* add refactor-analysis skill and rename to superpowers-extensions ([286f76a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/286f76a72a42ce71d17c39d7a709afcef617d1b5))
* add regression-test skill SKILL.md ([3530a0f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/3530a0f20716d9e5076a13438f8d96c9f565823a))
* add superpowers-marketplace as dependency for one-stop install ([6c642a2](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/6c642a25e939d935ba9ac91b7763acc544a62ba8))
* add test framework detection reference ([69296ff](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/69296ff0e769e2687f492a28853e140e58fb5e29))
* add visual evaluation criteria reference ([3c8b7c4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/3c8b7c467e792f378624a083bfc82f11cddf1655))
* **decision-tracker:** add plugin manifest ([c4b598f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c4b598f0b11f7885bf2b8e7e1b6d5cadfe67c278))
* **decision-tracker:** add skill for persistent decision tracking ([331d5ab](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/331d5abc053e8059c9df4b7a29796ef96212fecc))
* **pre-push-review:** add code quality rules reference ([9e22178](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/9e22178a791f813088eae2da222df45fd383809d))
* **pre-push-review:** add commit hygiene rules reference ([e58a30a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/e58a30a060978b6d44a91beeebd6e654c25ac03d))
* **pre-push-review:** add main skill orchestrator ([0991de1](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0991de17ee8efa7e047c1b857fbd8ce21d29c5e0))
* **pre-push-review:** add plugin metadata ([7587fb6](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/7587fb6e9d511185bb498ee9b1f596c215ada88e))
* **pre-push-review:** register plugin in marketplace ([104dc06](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/104dc06e33f95c3fa91a02fc9f0d91db34c07328))
* **refactor-analysis:** add complete SKILL.md with 7-phase workflow ([c5876d6](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c5876d6badcb35e6cf5f310411f64423fa9a5cb3))
* **refactor-analysis:** add reference types catalog ([56fda6f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/56fda6f6d020f6ddba67c34dac9e85bead257d22))
* **refactor-analysis:** register plugin in marketplace ([83b5360](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/83b5360e2a0a32ff9c59fba0074e0a35219ff81f))
* **refactor-analysis:** scaffold plugin directory ([a3d9172](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a3d9172f614be6ec771450c12225eefb116be41b))
* **regression-test:** add superpowers skill relationship section ([e02a757](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/e02a757472a1b87dfc7b0dea99d6261b42a825ec))
* restructure as Claude Code plugin with marketplace support ([db77a7d](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/db77a7d5cdeffeec1bb53044cbe1639530cccb33))
* **roslyn-codegraph-integration:** add bootstrap scripts for auto-install ([b422125](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/b42212556fa146d5202795f237f7d55a67f29d26))
* **roslyn-codegraph-integration:** add bootstrap scripts for auto-install ([ac0f93e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ac0f93e2c0b08ac54f5ec113fe74265cf364905d))
* **roslyn-codegraph-integration:** add superpowers integration skill ([6ba059e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/6ba059e604972e41fb5cdbd976316691865c29ea))
* **roslyn-codegraph-integration:** add superpowers integration skill for Roslyn code graph ([d43c90a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/d43c90a0c97f3d9def3b848d9a6f92cac59dd6d5))
* **roslyn-codegraph-integration:** add superpowers integration skill for Roslyn code graph ([1178759](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/11787599ce47e4a368d0892d6d208ef6db17d325))
* target Microsoft Playwright MCP server (@playwright/mcp) ([cb477d8](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/cb477d8c24f4b03da13eebd19d5024d4aa5a9c8f))
* upgrade marketplace to v2.0.0 hub with ecosystem dependencies ([bea9b54](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/bea9b541a0cee927e29ceb29334201c1b039c7ee))


### Bug Fixes

* add --caps=testing flag to install instructions ([a17591b](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a17591b6754363bb0f44ecf0d1ffff2cfcd561fc))
* address repo review findings ([4d36b2d](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/4d36b2d541b58102f0e384656329eef39ed690b8))
* address repo review findings ([bf49c86](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/bf49c861c5c9807c3afde77b3ff6cc7687dfa880))
* address review findings — version sync, lint config, docs, husky ([f1386f6](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/f1386f6c7c66ba8b86c376c9975ea79fe5c99e65))
* allow deps scope and relax body-max-line-length in commitlint ([65206f0](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/65206f08653ff4ef8f1616002e7f07d3ae896a81))
* **decision-tracker:** address code review findings ([8059f14](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/8059f14685ed546477971d8a5208409bfb355ec6))
* **decision-tracker:** tighten superpowers integration claims ([6cb746a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/6cb746a9d06abef1113e41cc7f9a72791b33a693))
* exclude CHANGELOG.md from markdownlint CI ([5794fbe](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/5794fbecf4b3d68f5ae665fda4cc52f1650e8250))
* remove double blank lines in CHANGELOG.md ([203cce4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/203cce46091ad9f438ba34aa3b32de318a719a65))
* remove duplicate .mcp.json files from decision-tracker and roslyn-codegraph-integration ([5510d77](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/5510d77cb548304882ce22fb7d677f0236045f0f))
* remove duplicate .mcp.json files from decision-tracker and roslyn-codegraph-integration ([ff06ea7](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ff06ea77e0a70e69be2366be6d898337c3e5e114))
* remove duplicate MCP configs, delegate to companion plugins ([602f830](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/602f830b23680c78febee2f8f1b119fd49388ad9))
* resolve all markdown lint errors in maintained files ([fdbe6e0](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/fdbe6e0fa884a685f31912ee7580e24a98e237f2))

## [1.3.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/v1.2.0...v1.3.0) (2026-03-06)


### Features

* **roslyn-codegraph-integration:** add bootstrap scripts for auto-install ([b422125](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/b42212556fa146d5202795f237f7d55a67f29d26))
* **roslyn-codegraph-integration:** add bootstrap scripts for auto-install ([ac0f93e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ac0f93e2c0b08ac54f5ec113fe74265cf364905d))


### Bug Fixes

* remove duplicate .mcp.json files from decision-tracker and roslyn-codegraph-integration ([5510d77](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/5510d77cb548304882ce22fb7d677f0236045f0f))
* remove duplicate .mcp.json files from decision-tracker and roslyn-codegraph-integration ([ff06ea7](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/ff06ea77e0a70e69be2366be6d898337c3e5e114))
* remove duplicate MCP configs, delegate to companion plugins ([602f830](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/602f830b23680c78febee2f8f1b119fd49388ad9))

## [1.2.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/v1.1.1...v1.2.0) (2026-03-06)


### Features

* add .mcp.json files for decision-tracker and roslyn-codegraph-integration ([a413413](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a41341326cedb7d36cf9b58bfa1c94c24e147dc0))

## [1.1.1](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/v1.1.0...v1.1.1) (2026-03-06)


### Bug Fixes

* exclude CHANGELOG.md from markdownlint CI ([5794fbe](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/5794fbecf4b3d68f5ae665fda4cc52f1650e8250))

## [1.1.0](https://github.com/MarcelRoozekrans/superpowers-extensions/compare/v1.0.0...v1.1.0) (2026-03-06)


### Features

* add decision-tracker plugin and upgrade to ecosystem hub ([7f913b4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/7f913b44ac3793538985f1ae3ba8561c30dfece5))
* add superpowers-marketplace as dependency for one-stop install ([6c642a2](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/6c642a25e939d935ba9ac91b7763acc544a62ba8))
* **decision-tracker:** add plugin manifest ([c4b598f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c4b598f0b11f7885bf2b8e7e1b6d5cadfe67c278))
* **decision-tracker:** add skill for persistent decision tracking ([331d5ab](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/331d5abc053e8059c9df4b7a29796ef96212fecc))
* **roslyn-codegraph-integration:** add superpowers integration skill ([6ba059e](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/6ba059e604972e41fb5cdbd976316691865c29ea))
* **roslyn-codegraph-integration:** add superpowers integration skill for Roslyn code graph ([d43c90a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/d43c90a0c97f3d9def3b848d9a6f92cac59dd6d5))
* **roslyn-codegraph-integration:** add superpowers integration skill for Roslyn code graph ([1178759](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/11787599ce47e4a368d0892d6d208ef6db17d325))
* upgrade marketplace to v2.0.0 hub with ecosystem dependencies ([bea9b54](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/bea9b541a0cee927e29ceb29334201c1b039c7ee))


### Bug Fixes

* **decision-tracker:** address code review findings ([8059f14](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/8059f14685ed546477971d8a5208409bfb355ec6))
* **decision-tracker:** tighten superpowers integration claims ([6cb746a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/6cb746a9d06abef1113e41cc7f9a72791b33a693))
* remove double blank lines in CHANGELOG.md ([203cce4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/203cce46091ad9f438ba34aa3b32de318a719a65))

## 1.0.0 (2026-03-06)

### Features

* add conventional commits enforcement and semantic versioning ([a75ad50](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a75ad5045406b903d98dcfde8ad7d7d6696446e3))
* add refactor-analysis skill and rename to superpowers-extensions ([286f76a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/286f76a72a42ce71d17c39d7a709afcef617d1b5))
* add regression-test skill SKILL.md ([3530a0f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/3530a0f20716d9e5076a13438f8d96c9f565823a))
* add test framework detection reference ([69296ff](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/69296ff0e769e2687f492a28853e140e58fb5e29))
* add visual evaluation criteria reference ([3c8b7c4](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/3c8b7c467e792f378624a083bfc82f11cddf1655))
* **pre-push-review:** add code quality rules reference ([9e22178](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/9e22178a791f813088eae2da222df45fd383809d))
* **pre-push-review:** add commit hygiene rules reference ([e58a30a](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/e58a30a060978b6d44a91beeebd6e654c25ac03d))
* **pre-push-review:** add main skill orchestrator ([0991de1](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/0991de17ee8efa7e047c1b857fbd8ce21d29c5e0))
* **pre-push-review:** add plugin metadata ([7587fb6](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/7587fb6e9d511185bb498ee9b1f596c215ada88e))
* **pre-push-review:** register plugin in marketplace ([104dc06](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/104dc06e33f95c3fa91a02fc9f0d91db34c07328))
* **refactor-analysis:** add complete SKILL.md with 7-phase workflow ([c5876d6](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/c5876d6badcb35e6cf5f310411f64423fa9a5cb3))
* **refactor-analysis:** add reference types catalog ([56fda6f](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/56fda6f6d020f6ddba67c34dac9e85bead257d22))
* **refactor-analysis:** register plugin in marketplace ([83b5360](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/83b5360e2a0a32ff9c59fba0074e0a35219ff81f))
* **refactor-analysis:** scaffold plugin directory ([a3d9172](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a3d9172f614be6ec771450c12225eefb116be41b))
* **regression-test:** add superpowers skill relationship section ([e02a757](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/e02a757472a1b87dfc7b0dea99d6261b42a825ec))
* restructure as Claude Code plugin with marketplace support ([db77a7d](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/db77a7d5cdeffeec1bb53044cbe1639530cccb33))
* target Microsoft Playwright MCP server (@playwright/mcp) ([cb477d8](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/cb477d8c24f4b03da13eebd19d5024d4aa5a9c8f))

### Bug Fixes

* add --caps=testing flag to install instructions ([a17591b](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/a17591b6754363bb0f44ecf0d1ffff2cfcd561fc))
* address repo review findings ([4d36b2d](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/4d36b2d541b58102f0e384656329eef39ed690b8))
* address repo review findings ([bf49c86](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/bf49c861c5c9807c3afde77b3ff6cc7687dfa880))
* allow deps scope and relax body-max-line-length in commitlint ([65206f0](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/65206f08653ff4ef8f1616002e7f07d3ae896a81))
* resolve all markdown lint errors in maintained files ([fdbe6e0](https://github.com/MarcelRoozekrans/superpowers-extensions/commit/fdbe6e0fa884a685f31912ee7580e24a98e237f2))
