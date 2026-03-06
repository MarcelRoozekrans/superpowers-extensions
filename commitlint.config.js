module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['regression-test', 'pre-push-review', 'refactor-analysis'],
    ],
    'scope-empty': [1, 'never'],
  },
};
