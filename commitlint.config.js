module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['regression-test', 'pre-push-review', 'refactor-analysis', 'decision-tracker', 'roslyn-codelens-integration', 'deps'],
    ],
    'scope-empty': [1, 'never'],
    'body-max-line-length': [0, 'always', Infinity],
  },
};
