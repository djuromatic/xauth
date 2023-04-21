import bcrypt from "bcrypt";
import { findByEmail } from "../service/account.service.js";
import { LoginException } from "../common/errors/exceptions.js";
import { PASSWORD_SALT_ROUNDS } from "./constants.js";

export const check = async (reqBody: Request["body"]) => {
  const { email, password } = reqBody as any;
  const account = await findByEmail(email);

  if (!account) {
    throw new LoginException(
      "Bad login attempt",
      "Account with that email does not exists",
      200
    );
  }
  if (!account.profile.email_verified) {
    throw new LoginException(
      "Bad login attempt",
      "Email has not yet been verified",
      200
    );
  }
  const passwordsMatch = await bcrypt.compare(
    password,
    (account as any).password
  );
  if (!passwordsMatch) {
    throw new LoginException("Bad login attempt", "Wrong password", 200);
  }

  const result = {
    login: {
      accountId: account.accountId,
    },
  };

  return result;
};
