import crypto from 'crypto';
import { findBySub, setFederatedAccountUsername } from '../service/account.service.js';
import { create, find, remove } from '../service/profile-update.service.js';
import { NOT_VALID_USERNAME } from './constants.js';

import { debug } from '../helpers/debug.js';

export const generateCode = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const profileNeedsUpdate = async (accountId: string) => {
  const account = await findBySub(accountId);

  if (account && account.profile.username == NOT_VALID_USERNAME) {
    return true;
  }
  return false;
};

export const createProfileUpdateRequest = async (accountId: string) => {
  const account = await findBySub(accountId);

  const code = generateCode();

  return await create({ accountId: account.accountId, code });
};

export const removeProfileUpdateRequest = async (code: string) => {
  await remove({ code });
};

export const renderProfileUpdatePage = async (provider: any, req: any, res: any, profileUpdateRequest: any) => {
  const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

  const client = await provider.Client.find(params.client_id as any);

  res.render('finish-registration', {
    code: profileUpdateRequest.code,
    client,
    uid,
    serverData: '{}',
    details: prompt.details,
    error: {},
    params,
    title: 'Finish Registration',
    session: session ? debug(session) : undefined,
    dbg: {
      params: debug(params),
      prompt: debug(prompt)
    }
  });
};
