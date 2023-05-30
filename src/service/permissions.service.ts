import PermissionsDb, { PermissionDocument } from '../models/permissions.js';
import { Logger } from '../utils/winston.js';
import { uid } from 'uid';

const logger = new Logger('PermissionService');

export const create = async (obj: { name: string }): Promise<PermissionDocument> => {
  const { name } = obj;

  const permissionAlreadyExists = (await PermissionsDb.findOne({ name })) != null;

  if (permissionAlreadyExists) {
    return await PermissionsDb.findOne({ name });
  } else {
    const generatedUID = uid();

    const permission = await PermissionsDb.create({ uid: generatedUID, name });

    return permission;
  }
};

export const find = async (obj: { name: string }): Promise<PermissionDocument> => {
  const permission = await PermissionsDb.findOne(obj);

  return permission;
};

export const findById = async (id: string): Promise<PermissionDocument> => {
  const permission = await PermissionsDb.findOne({ uid: id });

  return permission;
};

export const remove = async (obj: { name: string }): Promise<void> => {
  await PermissionsDb.deleteOne(obj);
};
