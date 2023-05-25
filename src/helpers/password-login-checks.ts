import bcrypt from 'bcrypt';
import { findByEmail } from '../service/account.service.js';
import { LoginException, EmailNotVerifiedException } from '../common/errors/exceptions.js';

export const check = async (reqBody: Request['body']) => {
  const { email, password } = reqBody as any;
  const account = await findByEmail(email);

  const errorDescription = (field: string, message: string) => {
    const serverData = { email, password };

    return JSON.stringify({ ...serverData, error: { field, message } });
  };

  if (!account) {
    throw new LoginException('Bad login attempt', errorDescription('email', 'Email not registered'), 200);
  }

  const passwordsMatch = await bcrypt.compare(password, (account as any).password);
  if (!passwordsMatch) {
    throw new LoginException('Bad login attempt', errorDescription('password', 'Wrong password'), 200);
  }

  if (!account.profile.email_verified) {
    throw new EmailNotVerifiedException(
      'Bad login attempt',
      errorDescription('email', 'Email has not yet been verified'),
      200
    );
  }

  const result = {
    login: {
      accountId: account.accountId
    }
  };

  return result;
};
