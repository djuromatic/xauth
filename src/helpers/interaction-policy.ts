import { interactionPolicy } from 'oidc-provider';

function getInteractionPolicy() {
  // const policy = interactionPolicy.base();
  const basePolicy = interactionPolicy.base();
  // basePolicy.remove("login");
  // basePolicy.remove("consent");
  // basePolicy.clear();

  const dateOfBirth = new interactionPolicy.Prompt(
    {
      name: 'login',
      requestable: true
    },
    (ctx) => {
      const { oidc } = ctx;

      return {
        ...(oidc.params.max_age === undefined ? undefined : { max_age: oidc.params.max_age }),
        ...(oidc.params.login_hint === undefined ? undefined : { login_hint: oidc.params.login_hint }),
        ...(oidc.params.id_token_hint === undefined ? undefined : { id_token_hint: oidc.params.id_token_hint })
      };
    }
  );

  basePolicy.add(dateOfBirth, 1);

  return basePolicy;
}

export { getInteractionPolicy };
