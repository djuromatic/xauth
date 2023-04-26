import { isBefore } from 'date-fns';

import PasswordResetRequestDb, { PasswordResetRequestDocument } from '../models/password-reset-request.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('PasswordResetRequestervice');

export const create = async (obj: { accountId: string; code: string }): Promise<PasswordResetRequestDocument> => {
  const { accountId, code } = obj;

  const emailAlreadySent = (await PasswordResetRequestDb.findOne({ accountId })) != null;

  if (!emailAlreadySent) {
    const passwordResetRequest = await PasswordResetRequestDb.create({
      accountId,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000 //10 minute expiration
    });

    return passwordResetRequest;
  } else {
    await PasswordResetRequestDb.updateOne(
      {
        accountId
      },
      {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000 //10 minute expiration
      }
    );

    const passwordResetRequest = await PasswordResetRequestDb.findOne({ code });

    return passwordResetRequest;
  }
};

export const find = async (obj: { code: string }): Promise<PasswordResetRequestDocument> => {
  const { code } = obj;
  const passwordResetRequest = await PasswordResetRequestDb.findOne({ code });

  if (passwordResetRequest && isBefore(Date.now(), passwordResetRequest.expiresAt)) return passwordResetRequest;

  return undefined;
};

export const remove = async (obj: { code: string }): Promise<void> => {
  const { code } = obj;
  await PasswordResetRequestDb.deleteOne({ code });
};
