import { interactionPolicy } from 'oidc-provider';

function getInteractionPolicy() {
  const basePolicy = interactionPolicy.base();
  return basePolicy;
}

export { getInteractionPolicy };
