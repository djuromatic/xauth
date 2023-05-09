import bcrypt from 'bcrypt';
import { Account, KoaContextWithOIDC } from 'oidc-provider';
import AccountDb, { AccountDocument, EmailPasswordAccountDocument } from '../models/account.js';
import { PASSWORD_SALT_ROUNDS } from '../helpers/constants.js';
import { ProviderName } from '../common/enums/provider.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('AccountService');

export const findAccount = async (ctx: KoaContextWithOIDC, id: string): Promise<Account> => {
  const account = await AccountDb.findOne({ accountId: id });

  if (!account) {
    throw new Error('User not found');
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
        locale: account.profile.locale
      };
    }
  };
};

export const findByEmail = async (email: string): Promise<AccountDocument | EmailPasswordAccountDocument> => {
  const account = await AccountDb.findOne({ 'profile.email': email });

  return account;
};

export const findByUsername = async (username: string): Promise<AccountDocument | EmailPasswordAccountDocument> => {
  const account = await AccountDb.findOne({ 'profile.username': username });
  logger.debug('find by username', { findByUsername: { account } });
  return account;
};

export const findByFederated = async (provider: ProviderName, sub: string): Promise<AccountDocument | null> => {
  const account = await AccountDb.findOne({ accountId: `${provider}|${sub}` });

  return account;
};

export const createFederatedAccount = async (accountId: string, profile: any): Promise<AccountDocument> => {
  const account = await AccountDb.create({
    accountId,
    profile
  });

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
  const { email, family_name, given_name, locale, password: plainTextPassword } = obj;

  const password = await bcrypt.hash(plainTextPassword, PASSWORD_SALT_ROUNDS);

  let account = await AccountDb.create({
    accountId: email,
    password,
    profile: {
      sub: email,
      email: email,
      email_verified: false,
      family_name,
      given_name,
      locale
    }
  });

  await AccountDb.updateOne({ _id: account._id }, { 'profile.sub': account._id });

  account = await AccountDb.findOne({ _id: account._id });
  return account;
};

export const updateAccountPassword = async (accountId: string, newPassword: string): Promise<AccountDocument> => {
  const password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

  await AccountDb.updateOne({ accountId }, { password });

  const account = await AccountDb.findOne({ accountId });
  return account;
};

export const updateAccountVerificationStatus = async (accountId: string, status: boolean): Promise<AccountDocument> => {
  await AccountDb.updateOne({ accountId }, { 'profile.email_verified': status });

  const account = await AccountDb.findOne({ accountId });
  return account;
};
