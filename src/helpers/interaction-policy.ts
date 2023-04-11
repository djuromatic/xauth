import {  interactionPolicy } from "oidc-provider";

function getInteractionPolicy() {
  const policy = interactionPolicy.base();
  const dateOfBirth = new interactionPolicy.Prompt({
    name: "dateOfBirth",
    requestable: true,
  });

  policy.add(dateOfBirth, 1);
  return policy;
}

export { getInteractionPolicy };
