const NAME_A_MODEL = 'Name a model on this dispatch: sonnet for implementers and reviewers, opus for plan-marked hard tasks, stuck retries and the final whole-branch review, haiku for lookups. Never fable.';
const NO_FABLE = 'Fable is not used in this suite: name sonnet, opus or haiku on this dispatch.';

export function checkDispatch(toolInput, config) {
  const input = toolInput || {};
  const model = typeof input.model === 'string' ? input.model : '';
  if (/fable/i.test(model)) return { deny: true, reason: NO_FABLE };
  if (!config.enforceDispatchModel) return { deny: false };
  const type = typeof input.subagent_type === 'string' ? input.subagent_type : '';
  const inherits = type === '' || type === 'general-purpose';
  if (inherits && model === '') return { deny: true, reason: NAME_A_MODEL };
  return { deny: false };
}
