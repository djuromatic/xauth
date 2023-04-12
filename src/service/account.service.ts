import { Account, KoaContextWithOIDC } from "oidc-provider";
import AccountDb, { AccountDocument } from "../models/account.js";

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

export const findByEmail = async (email: string): Promise<AccountDocument> => {
  console.log(`findByEmail:${email}`);
  let account = await AccountDb.findOne({ "profile.email": email });

  if (!account) {
    account = await AccountDb.create({
      accountId: email,
      profile: {
        sub: email,
        email: email,
        email_verified: false,
        family_name: "djuro",
        given_name: "matic",
        locale: "en",
      },
    });
  }

  return account;
};
