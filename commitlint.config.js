module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['regression-test', 'pre-push-review', 'refactor-analysis', 'decision-tracker', 'roslyn-codelens-integration', 'memorylens-integration', 'project-orchestration', 'ui-workflow', 'marketplace', 'state', 'milestone', 'roadmap', 'deps'],
    ],
    'scope-empty': [1, 'never'],
    'header-max-length': [2, 'always', 125],
    'body-max-line-length': [0, 'always', Infinity],
  },
};
