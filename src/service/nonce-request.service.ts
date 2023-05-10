import { isBefore } from 'date-fns';

import NonceRequestDb, { NonceRequestDocument } from '../models/nonce-requests.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('NonceRequestService');

export const create = async (obj: { interactionId: string; nonce: string }): Promise<NonceRequestDocument> => {
  const { interactionId, nonce } = obj;

  const nonceAlreadySent = (await NonceRequestDb.findOne({ interactionId })) != null;

  if (!nonceAlreadySent) {
    const nonceRequest = await NonceRequestDb.create({
      interactionId,
      nonce,
      expiresAt: Date.now() + 1 * 24 * 60 * 60 * 1000 //1 day expiration
    });

    return nonceRequest;
  } else {
    await NonceRequestDb.updateOne(
      {
        interactionId
      },
      {
        nonce,
        expiresAt: Date.now() + 1 * 24 * 60 * 60 * 1000 //1 day expiration
      }
    );

    const nonceRequest = await NonceRequestDb.findOne({ nonce });

    return nonceRequest;
  }
};

export const find = async (obj: { nonce: string }): Promise<NonceRequestDocument> => {
  const { nonce } = obj;
  const nonceRequest = await NonceRequestDb.findOne({ nonce });

  if (nonceRequest && isBefore(Date.now(), nonceRequest.expiresAt)) return nonceRequest;

  return undefined;
};

export const remove = async (obj: { nonce: string }): Promise<void> => {
  const { nonce } = obj;
  await NonceRequestDb.deleteOne({ nonce });
};
