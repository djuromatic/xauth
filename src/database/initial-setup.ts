import { serverConfig } from '../config/server-config.js';
import { addRole, findByEmail } from '../service/account.service.js';
import { find as findRole, create as createRole } from '../service/roles.service.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('DB inital setup');

export const initialDBSetup = async () => {
  await _addAdminRoleToDB();
  await _giveoutAdminRoles();
};

const _addAdminRoleToDB = async () => {
  const role = await findRole({ name: 'admin' });

  if (!role) {
    await createRole({ name: 'admin' });
    logger.info('Created `admin` role');
  }
};

const _giveoutAdminRoles = async () => {
  for (const adminEmail of serverConfig.startAdmins) {
    const account = await findByEmail(adminEmail);

    if (account && !account.roles.includes('admin')) {
      await addRole(account.accountId, 'admin');
      logger.info('Gave `admin` role to `' + adminEmail + '`');
    }
  }
};
