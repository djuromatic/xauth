import crypto from 'crypto';
import { utils } from 'ethers';
import { findByEthAddress, setEthAddress } from '../service/account.service.js';
import { find as findNonceRequest, remove as removeNonceRequest } from '../service/nonce-request.service.js';
import { MetamaskException } from '../common/errors/exceptions.js';

export const generateNonce = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const linkAccount = async (accountId: string, reqBody: Request['body']) => {
  const { metamask_nonce, metamask_signature } = reqBody as any;

  if (metamask_nonce === '') {
    return;
  }

  const ethAddress = utils.verifyMessage(metamask_nonce, metamask_signature);

  await setEthAddress(accountId, ethAddress);

  await removeNonceRequest({ nonce: metamask_nonce });
};

export const check = async (reqBody: Request['body']) => {
  const { email, password, dateOfBirth, username, fullName } = reqBody as any;

  const serverData = { email, password, dateOfBirth, username, fullName };

  const errorDescription = (step: number, field: string, message: string) => {
    return JSON.stringify({ ...serverData, step, error: { field, message } });
  };

  const { metamask_nonce, metamask_signature } = reqBody as any;

  if (metamask_nonce === '') {
    return;
  }

  const nonceRequest = await findNonceRequest({ nonce: metamask_nonce });

  if (!nonceRequest) {
    throw new MetamaskException('Not a valid nonce', errorDescription(2, 'metamask', 'Not a valid nonce'), 404);
  }

  const ethAddress = utils.verifyMessage(metamask_nonce, metamask_signature);

  const account = await findByEthAddress(ethAddress);

  if (account) {
    throw new MetamaskException(
      'ETH address already in use',
      errorDescription(2, 'metamask', 'Address already in use'),
      404
    );
  }
};
