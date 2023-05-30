/* eslint-disable no-console, camelcase, no-unused-vars */

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import * as jose from 'jose';

import { find as findRole } from '../service/roles.service.js';
import { find as findPermission } from '../service/permissions.service.js';

import { Logger } from '../utils/winston.js';
import { serverConfig } from '../config/server-config.js';

const logger = new Logger('RoleGuards');

export const adminGuard = async (req: Request, res: Response, next: NextFunction) => {
  return userHasRole('admin', req, res, next)();
};

export const userHasRole = (roleName: string, req: Request, res: Response, next: NextFunction) => {
  return async () => {
    try {
      const { payload } = await _verifyToken(req);

      if (!(payload.roles as any).includes(roleName)) {
        return res.json({ error: `Access Denied; User doesnt't have the role "${roleName}"` });
      }
      next();
    } catch (err) {
      return res.json({ error: 'Access Denied' });
    }
  };
};

export const userHasPermission = (permissionName: string, req: Request, res: Response, next: NextFunction) => {
  return async () => {
    try {
      const { payload } = await _verifyToken(req);

      let userCanProceed = false;
      const permissionId = (await findPermission({ name: permissionName })).uid;
      for (const roleName of payload.roles as any) {
        const role = await findRole({ name: roleName });
        if (role && role.permissionIds.includes(permissionId)) {
          userCanProceed = true;
          break;
        }
      }

      if (!userCanProceed) {
        return res.json({ error: `Access Denied; User doesnt't have the permission "${permissionName}"` });
      }
      next();
    } catch (err) {
      return res.json({ error: 'Access Denied' });
    }
  };
};

const _verifyToken = async (req: Request) => {
  const bearerToken = req.headers['authorization'];

  const url = serverConfig.oidc.issuer + '/jwks';
  const JWKS = jose.createRemoteJWKSet(new URL(url));
  const jwtToken = bearerToken.split(' ')[1];

  const { payload, protectedHeader } = await jose.jwtVerify(jwtToken, JWKS, {
    issuer: serverConfig.oidc.issuer
  });
  return { payload };
};
