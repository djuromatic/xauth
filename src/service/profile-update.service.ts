import { isBefore } from 'date-fns';

import ProfileUpdateDb, { ProfileUpdateDocument } from '../models/profile-update.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('ProfileUpdateService');

export const create = async (obj: { accountId: string; code: string }): Promise<ProfileUpdateDocument> => {
  const { accountId, code } = obj;

  const updateAlreadyRequested = (await ProfileUpdateDb.findOne({ accountId })) != null;

  if (!updateAlreadyRequested) {
    const profileUpdate = await ProfileUpdateDb.create({
      accountId,
      code,
      expiresAt: Date.now() + 1 * 1 * 60 * 60 * 1000 //1 hour expiration
    });

    return profileUpdate;
  } else {
    await ProfileUpdateDb.updateOne(
      {
        accountId
      },
      {
        code,
        expiresAt: Date.now() + 1 * 1 * 60 * 60 * 1000 //1 hour expiration
      }
    );

    const profileUpdate = await ProfileUpdateDb.findOne({ code });

    return profileUpdate;
  }
};

export const find = async (obj: { code: string }): Promise<ProfileUpdateDocument> => {
  const { code } = obj;
  const profileUpdate = await ProfileUpdateDb.findOne({ code });

  if (profileUpdate && isBefore(Date.now(), profileUpdate.expiresAt)) return profileUpdate;

  return undefined;
};

export const remove = async (obj: { code: string }): Promise<void> => {
  const { code } = obj;
  await ProfileUpdateDb.deleteOne({ code });
};
