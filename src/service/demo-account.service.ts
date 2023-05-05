import { Account, KoaContextWithOIDC } from 'oidc-provider';
import DemoAccount from '../models/demo-account.js';
import { Logger } from '../utils/winston.js';
import { DemoAccountDocument } from '../models/demo-account.js';
import { BadRequestException, UnauthorizedException } from '../common/errors/exceptions.js';
import { ProviderName } from '../common/enums/provider.js';
import { subMinutes } from 'date-fns';
import mongoose from 'mongoose';
const logger = new Logger('DemoAccountService');

export const findDemoAccount = async (ctx: KoaContextWithOIDC, id: string): Promise<Account> => {
  const account = await DemoAccount.findOne({ accountId: id });

  if (!account) {
    // destory session
    await ctx.oidc.session.destroy();
    throw new Error('User not found');
  }

  //todo redundent code
  //todo find way to revoke token in n minutes and emit this event
  const now = new Date();
  const expiredAt = subMinutes(now, 5);

  if (account.createdAt < expiredAt) {
    await ctx.oidc.session.destroy();
    throw new UnauthorizedException('Invalid credentials');
  }

  return {
    accountId: account.accountId,
    async claims(use, scope, claims, rejected) {
      return {
        sub: account.accountId,
        demo: true,
        createdAt: account.createdAt
      };
    }
  };
};

export default class DemoService {
  public static async login(fingerprint: string): Promise<DemoAccountDocument> {
    //check if fingerprint exists
    const checkIfFingerprintExists = await this.findDemoByFingerprint(fingerprint);

    if (checkIfFingerprintExists) {
      // check if still valid (not expired)

      //todo redundent code
      //todo find way to revoke token in n minutes and emit this event
      const now = new Date();
      const expiredAt = subMinutes(now, 5);

      if (checkIfFingerprintExists.createdAt < expiredAt) {
        // expired
        // throw error
        throw new UnauthorizedException('Invalid credentials');
      }

      // not expired
    }

    // create demo account
    const demoAccount = await this.createDemoAccount(fingerprint);

    return demoAccount;
  }

  public static async findDemoByAccountId(accountId: string) {
    try {
      const account: DemoAccountDocument = await DemoAccount.findOne({ accountId });

      return account;
    } catch (err) {
      logger.error(err);

      throw new BadRequestException('Bad request');
    }
  }

  public static async createDemoAccount(fingerprint: string): Promise<DemoAccountDocument> {
    try {
      const account: DemoAccountDocument = await DemoAccount.create({
        _id: new mongoose.Types.ObjectId(),
        fingerprint
      });

      // update account Id with the newly created account
      account.accountId = `${ProviderName.DEMO}|${account._id.toString()}`;

      const newDemoAccount = await DemoAccount.findOneAndUpdate({ _id: account._id }, account, { new: true }).lean();
      return newDemoAccount;
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Bad Request');
    }
  }

  public static async findDemoByFingerprint(fingerprint: string): Promise<DemoAccountDocument | null> {
    const account = await DemoAccount.findOne({ fingerprint });

    return account;
  }
}
