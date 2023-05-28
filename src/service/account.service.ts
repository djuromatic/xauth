import bcrypt from 'bcrypt';
import { Account, KoaContextWithOIDC } from 'oidc-provider';
import AccountDb, { AccountDocument, EmailPasswordAccountDocument } from '../models/account.js';
import { NOT_VALID_USERNAME, PASSWORD_SALT_ROUNDS } from '../helpers/constants.js';
import { ProviderName } from '../common/enums/provider.js';
import { Logger } from '../utils/winston.js';
import { TokenSet } from 'openid-client';
import { UnauthorizedException } from '../common/errors/exceptions.js';

const logger = new Logger('AccountService');

export const findAccount = async (ctx: KoaContextWithOIDC, id: string): Promise<Account> => {
  const account = await AccountDb.findOne({ accountId: id });

  if (!account) {
    await ctx.oidc.session.destroy();
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
  return account;
};

export const findBySub = async (sub: string): Promise<AccountDocument | EmailPasswordAccountDocument> => {
  const account = await AccountDb.findOne({ 'profile.sub': sub });
  return account;
};

export const findByEthAddress = async (address: string): Promise<AccountDocument | EmailPasswordAccountDocument> => {
  const account = await AccountDb.findOne({ 'profile.ethAddress': address });
  return account;
};

export const findByFederated = async (provider: ProviderName, sub: string): Promise<AccountDocument | null> => {
  const account = await AccountDb.findOne({
    'profile.sub': `${provider.toString()}|${sub}`
  });
  return account;
};

export const createFederatedAccount = async (
  sub: string,
  upstream: ProviderName,
  tokenSet: TokenSet,
  user?: any
): Promise<AccountDocument> => {
  try {
    const accountId = `${upstream}|${sub}`;
    let profile;
    if (upstream === ProviderName.APPLE) {
      if (!user) {
        throw new UnauthorizedException('Failed to create account Apple is missing user');
      }
      profile = mapAppleUserProfile(user, tokenSet, accountId);
    }

    if (upstream === ProviderName.GOOGLE) {
      profile = mapGoogleProfile(accountId, tokenSet);
    }

    profile.username = NOT_VALID_USERNAME; //only for federeate accounts
    const account = await AccountDb.create({
      accountId,
      profile
    });

    return account;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const create = async (obj: {
  email: string;
  password: string;
  family_name: string;
  given_name: string;
  dateOfBirth: string;
  gender: string;
  locale: string;
  username: string;
}): Promise<AccountDocument> => {
  const { email, family_name, given_name, locale, password: plainTextPassword, username } = obj;

  const password = await bcrypt.hash(plainTextPassword, PASSWORD_SALT_ROUNDS);

  let account = await AccountDb.create({
    accountId: email,
    password,
    profile: {
      sub: email,
      username: username,
      email: email,
      email_verified: false,
      family_name,
      given_name,
      locale
    }
  });

  await AccountDb.updateOne(
    { _id: account._id },
    {
      $set: {
        profile: {
          sub: account._id
        }
      }
    }
  );

  account = await AccountDb.findOne({ _id: account._id });
  return account;
};

export const updateAccountPassword = async (accountId: string, newPassword: string): Promise<AccountDocument> => {
  const password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

  await AccountDb.updateOne({ accountId }, { $set: { password } });

  const account = await AccountDb.findOne({ accountId });
  return account;
};

export const updateAccountVerificationStatus = async (accountId: string, status: boolean): Promise<AccountDocument> => {
  await AccountDb.updateOne(
    { accountId },
    {
      $set: {
        profile: {
          email_verified: status
        }
      }
    }
  );

  const account = await AccountDb.findOne({ accountId });
  return account;
};

export const setFederatedAccountUsername = async (sub: string, username: string): Promise<AccountDocument | null> => {
  const account = await AccountDb.findOne({ 'profile.sub': sub });

  if (account) {
    account.profile.username = username;
    await AccountDb.updateOne({ 'profile.sub': sub }, { $set: account });
  } else {
    throw new Error(`Account with id ${sub} not found`);
  }

  return await AccountDb.findOne({ 'profile.sub': `${sub}` });
};

export const setEthAddress = async (accountId: string, address: string): Promise<AccountDocument | null> => {
  const account = await AccountDb.findOne({ accountId: accountId });

  if (account) {
    account.profile.ethAddress = address;
    await AccountDb.updateOne({ accountId: accountId }, { $set: account });
  } else {
    throw new Error(`Account with id ${accountId} not found`);
  }

  return await AccountDb.findOne({ accountId });
};

function mapAppleUserProfile(user: string, tokenSet: TokenSet, sub: string) {
  const removeHtmlEntities = user.replace(/&#34;/g, '"');
  //parse user string to object
  const parsedUser = JSON.parse(removeHtmlEntities);

  //create the user object
  const userObj = {
    given_name: parsedUser.name.firstName,
    family_name: parsedUser.name.lastName,
    email: parsedUser.email
  };

  //merge the claims from the id_token with the user object
  const profile = {
    ...getClaimsFromIdToken(tokenSet.id_token),
    ...userObj,
    locale: 'en',
    username: userObj.email, //TODO set this to username
    sub
  };
  return profile;
}

function mapGoogleProfile(accountId: string, tokenSet: TokenSet) {
  const claims = tokenSet.claims();
  const profile = {
    ...claims,
    username: claims.email, //TODO set this to username
    sub: accountId
  };

  return profile;
}

const getClaimsFromIdToken = (idToken: string): object => {
  const decodedClaims = Buffer.from(idToken.split('.')[1], 'base64').toString('utf8');
  const claims = JSON.parse(decodedClaims);
  return claims;
};
