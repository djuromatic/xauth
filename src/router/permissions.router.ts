/* eslint-disable no-console, camelcase, no-unused-vars */
import { Express } from 'express';

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';

import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import {
  create as createPermission,
  find as findPermission,
  findById as findPermissionById
} from '../service/permissions.service.js';
import {
  findAll as findAllRoles,
  find as findRole,
  revokePermission,
  updateRolePermissions
} from '../service/roles.service.js';

import { Logger } from '../utils/winston.js';

const logger = new Logger('PermissionsRouter');

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  function adminGuard(req: Request, res: Response, next: NextFunction) {
    //TODO: implement with express-jwt
    next();
  }

  app.post('/permissions/create', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { permissionName } = req.body;
      if (!permissionName || permissionName === '') {
        return res.json({ error: 'Empty permission name' });
      }

      const permission = await findPermission({ name: permissionName });

      if (permission) {
        return res.json({ error: `Permission with name "${permissionName}" already exists` });
      }

      await createPermission({ name: permissionName });

      return res.json({ status: `Permission with name "${permissionName}" created` });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/permissions/assign', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    //assigns a permission to the provided role
    try {
      const { permissionName, roleName } = req.body;
      if (!permissionName || permissionName === '') {
        return res.json({ error: 'Empty permission name' });
      }
      if (!roleName || roleName === '') {
        return res.json({ error: 'Empty role name' });
      }

      const role = await findRole({ name: roleName });

      if (!role) {
        return res.json({ error: `Role with name "${roleName}" doesn't exist` });
      }

      const permissionId = (await findPermission({ name: permissionName })).uid;

      if (role.permissionIds.includes(permissionId)) {
        return res.json({ error: `Role: ${roleName} already has the permission: ${permissionName}` });
      }

      const updatedRole = await updateRolePermissions(roleName, [...role.permissionIds, permissionId]);

      const permissionNames = (
        await Promise.all(updatedRole.permissionIds.map(async (pId) => await findPermissionById(pId)))
      ).map((p) => p.name);

      return res.json({ status: `Role: ${roleName} now has the permissions: "${permissionNames}"` });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/permissions/revoke', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    //revokes a permission from a role
    try {
      const { permissionName, roleName } = req.body;
      if (!permissionName || permissionName === '') {
        return res.json({ error: 'Empty permission name' });
      }
      if (!roleName || roleName === '') {
        return res.json({ error: 'Empty role name' });
      }

      const role = await findRole({ name: roleName });

      if (!role) {
        return res.json({ error: `Role with name "${roleName}" doesn't exist` });
      }

      const permission = await findPermission({ name: permissionName });

      if (!permission) {
        return res.json({ error: `Permission with name "${permissionName}" doesn't exist` });
      }

      if (!role.permissionIds.includes(permission.uid)) {
        return res.json({ error: `Role: ${roleName} doesn't have the permission: ${permissionName}` });
      }

      const updatedRole = await revokePermission(roleName, permission.uid);
      console.log({ updatedRole });
      const permissionNames = (
        await Promise.all(updatedRole.permissionIds.map(async (pId) => await findPermissionById(pId)))
      ).map((p) => p.name);

      return res.json({ status: `Role: ${roleName} now has the permissions: "${permissionNames}"` });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/permissions/delete', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    //deletes a permission entirely and removes it from all roles that have it
    try {
      const { permissionName } = req.body;
      if (!permissionName || permissionName === '') {
        return res.json({ error: 'Empty permission name' });
      }

      const permission = await findPermission({ name: permissionName });

      if (!permission) {
        return res.json({ error: `Permission with name "${permissionName}" doesn't exist` });
      }

      const allRoles = await findAllRoles();

      await Promise.all(
        allRoles.map((role) => {
          revokePermission(role.name, permission.uid);
        })
      );

      return res.json({ status: `Permission with name "${permissionName}" has been removed` });
    } catch (err) {
      return next(err);
    }
  });
  interactionErrorHandler(app, provider);
};
