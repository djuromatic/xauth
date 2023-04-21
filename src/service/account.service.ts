import bcrypt from "bcrypt";
import { Account, KoaContextWithOIDC } from "oidc-provider";
import AccountDb, {
  AccountDocument,
  EmailPasswordAccountDocument,
} from "../models/account.js";
import { PASSWORD_SALT_ROUNDS } from "../helpers/constants.js";

export const findAccount = async (
  ctx: KoaContextWithOIDC,
  id: string
): Promise<Account> => {
  const account = await AccountDb.findOne({ accountId: id });

  if (!account) {
    throw new Error("User not found");
  }

  return {
    accountId: account.accountId,
    async claims(use, scope, claims, rejected) {
      return {
        sub: account.accountId,
        email: account.profile.email,
        email_verified: account.profile.email_verified,
        family_name: account.profile.family_name,
        given_name: account.profile.given_name,
        locale: account.profile.locale,
      };
    },
  };
};

export const findByEmail = async (
  email: string
): Promise<AccountDocument | EmailPasswordAccountDocument> => {
  const account = await AccountDb.findOne({ "profile.email": email });

  return account;
};

export const findByUsername = async (
  username: string
): Promise<AccountDocument | EmailPasswordAccountDocument> => {
  const account = await AccountDb.findOne({ "profile.username": username });
  console.log({ findByUsername: { account } });
  return account;
};

export const create = async (obj: {
  email: string;
  password: string;
  family_name: string;
  given_name: string;
  dateOfBirth: string;
  gender: string;
  locale: string;
}): Promise<AccountDocument> => {
  const {
    email,
    family_name,
    given_name,
    locale,
    password: plainTextPassword,
  } = obj;

  const password = await bcrypt.hash(plainTextPassword, PASSWORD_SALT_ROUNDS);

  const account = await AccountDb.create({
    accountId: email,
    password,
    profile: {
      sub: email,
      email: email,
      email_verified: false,
      family_name,
      given_name,
      locale,
    },
  });

  return account;
};
