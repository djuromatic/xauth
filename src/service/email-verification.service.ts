import EmailVerificationDb, { EmailVerificationDocument } from '../models/email-verification.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('EmailVerificationService');

export const create = async (obj: { accountId: string; code: string }): Promise<EmailVerificationDocument> => {
  const { accountId, code } = obj;

  const emailVerification = await EmailVerificationDb.create({
    accountId,
    code,
    expiresAt: Date.now() + 10 * 60 * 60 //10 minute expiration
  });

  return emailVerification;
};

export const find = async (obj: { code: string }): Promise<EmailVerificationDocument> => {
  const { code } = obj;
  const emailVerification = await EmailVerificationDb.findOne({ code });
  return emailVerification;
};

export const remove = async (obj: { code: string }): Promise<void> => {
  const { code } = obj;
  await EmailVerificationDb.deleteOne({ code });
};
