/* eslint-disable no-console, camelcase, no-unused-vars */
import { Express } from 'express';

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';

import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import { create as createRole, find as findRole, remove as removeRole } from '../service/roles.service.js';
import { debug } from '../helpers/debug.js';
import { Logger } from '../utils/winston.js';
import { findAccountByAccountId, updateAccountRoles, revokeRole } from '../service/account.service.js';
import { adminGuard } from '../helpers/route-guards.js';
import cors from 'cors';
const logger = new Logger('RolesRouter');

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.use('/roles', cors());

  app.post('/roles/create', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleName } = req.body;
      if (roleName === '') {
        return res.json({ error: 'Empty role name' });
      }

      const role = await findRole({ name: roleName });

      if (role) {
        return res.json({ error: `Role with name "${roleName}" already exists` });
      }

      await createRole({ name: roleName });

      return res.json({ status: `Role with name "${roleName}" created` });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/roles/assign', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleName, accountId } = req.body;
      if (roleName === '') {
        return res.json({ error: 'Empty role name' });
      }

      const role = await findRole({ name: roleName });

      if (!role) {
        return res.json({ error: `Role with name "${roleName}" doesn't exist` });
      }

      const account = await findAccountByAccountId(accountId);

      if (!account) {
        return res.json({ error: `Account: ${accountId} doesnt exist` });
      }

      if (account.roles.includes(roleName)) {
        return res.json({ error: `Account: ${accountId} already has the role: "${roleName}"` });
      }

      const updateAccount = await updateAccountRoles(accountId, [...account.roles, roleName]);

      return res.json({ status: `Account: ${accountId} now has roles: "${updateAccount.roles}"` });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/roles/revoke', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleName, accountId } = req.body;
      if (roleName === '') {
        return res.json({ error: 'Empty role name' });
      }

      const role = await findRole({ name: roleName });

      if (!role) {
        return res.json({ error: `Role with name "${roleName}" doesn't exist` });
      }

      const account = await findAccountByAccountId(accountId);

      if (!account) {
        return res.json({ error: `Account: ${accountId} doesnt exist` });
      }

      if (!account.roles.includes(roleName)) {
        return res.json({ error: `Account: ${accountId} doesn't have the role: "${roleName}"` });
      }

      const updatedAccount = await revokeRole(accountId, roleName);

      return res.json({ status: `Account: ${accountId} now has roles: "${updatedAccount.roles}"` });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/roles/delete', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleName } = req.body;
      if (roleName === '') {
        return res.json({ error: 'Empty role name' });
      }

      const role = await findRole({ name: roleName });

      if (!role) {
        return res.json({ error: `Role with name "${roleName}" doesn't exist` });
      }

      //TODO: what about all the accounts that have a soon to be deleted role?

      await removeRole({ name: roleName });

      return res.json({ status: `Role with name "${roleName}" has been removed` });
    } catch (err) {
      return next(err);
    }
  });

  interactionErrorHandler(app, provider);
};
