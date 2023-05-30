import RolesDb, { RoleDocument } from '../models/roles.js';
import { Logger } from '../utils/winston.js';
import { uid } from 'uid';

const logger = new Logger('RoleService');

export const create = async (obj: { name: string }): Promise<RoleDocument> => {
  const { name } = obj;

  const roleAlreadyExists = (await RolesDb.findOne({ name })) != null;

  if (roleAlreadyExists) {
    return await RolesDb.findOne({ name });
  } else {
    const generatedUID = uid();
    const role = await RolesDb.create({ uid: generatedUID, name });

    return role;
  }
};

export const find = async (obj: { name: string }): Promise<RoleDocument> => {
  const role = await RolesDb.findOne(obj);

  return role;
};

export const remove = async (obj: { name: string }): Promise<void> => {
  await RolesDb.deleteOne(obj);
};
export const updateRolePermissions = async (name: string, permissionIds: string[]): Promise<RoleDocument> => {
  await RolesDb.updateOne({ name }, { permissionIds });

  const role = await RolesDb.findOne({ name });
  return role;
};

export const revokePermission = async (name: string, permissionId: string): Promise<RoleDocument> => {
  const role = await RolesDb.findOne({ name });

  if (role && role.permissionIds.includes(permissionId)) {
    const newPermissionIds = role.permissionIds.filter((pId) => pId != permissionId);
    await RolesDb.updateOne({ name }, { permissionIds: newPermissionIds });
  }

  return await RolesDb.findOne({ name });
};

export const findAll = async (): Promise<RoleDocument[]> => {
  const roles = await RolesDb.find();

  return roles;
};
