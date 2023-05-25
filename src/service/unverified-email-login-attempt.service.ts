import { isBefore } from 'date-fns';

import UnverifiedEmailLoginAttemptDb, {
  UnverifiedEmailLoginAttemptDocument
} from '../models/unverified-email-login-attempt.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('UnverifiedEmailLoginAttemptService');

export const create = async (obj: {
  interactionId: string;
  accountId: string;
}): Promise<UnverifiedEmailLoginAttemptDocument> => {
  const { interactionId, accountId } = obj;

  const attemptAlreadyMade = (await UnverifiedEmailLoginAttemptDb.findOne({ interactionId })) != null;

  if (!attemptAlreadyMade) {
    const loginRequest = await UnverifiedEmailLoginAttemptDb.create({
      interactionId,
      accountId,
      expiresAt: Date.now() + 1 * 24 * 60 * 60 * 1000 //1 day expiration
    });

    return loginRequest;
  } else {
    await UnverifiedEmailLoginAttemptDb.updateOne(
      {
        interactionId
      },
      {
        accountId,
        expiresAt: Date.now() + 1 * 24 * 60 * 60 * 1000 //1 day expiration
      }
    );

    const loginRequest = await UnverifiedEmailLoginAttemptDb.findOne({ interactionId });

    return loginRequest;
  }
};

export const find = async (obj: { interactionId: string }): Promise<UnverifiedEmailLoginAttemptDocument> => {
  const { interactionId } = obj;
  const loginRequest = await UnverifiedEmailLoginAttemptDb.findOne({ interactionId });

  if (loginRequest && isBefore(Date.now(), loginRequest.expiresAt)) return loginRequest;

  return undefined;
};

export const remove = async (obj: { interactionId: string }): Promise<void> => {
  const { interactionId } = obj;
  await UnverifiedEmailLoginAttemptDb.deleteOne({ interactionId });
};
