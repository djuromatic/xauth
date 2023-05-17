import { findByEmail, findByUsername } from '../service/account.service.js';
import { SignupException } from '../common/errors/exceptions.js';

import { checkDateOfBirth, checkEmail, checkPassword, checkUsername } from './input-checks.js';

let errorDescription: any;

export const check = async (reqBody: Request['body']) => {
  const { email, password, dateOfBirth, username, fullName } = reqBody as any;

  const serverData = { email, password, dateOfBirth, username, fullName };

  errorDescription = (step: number, field: string, message: string) => {
    return JSON.stringify({ ...serverData, step, error: { field, message } });
  };

  //Age related verification
  const dateOfBirthErrors = checkDateOfBirth(dateOfBirth);
  if (dateOfBirthErrors.length > 0) {
    throw new SignupException(
      'Bad signup attempt',
      errorDescription(1, dateOfBirthErrors[0].field, dateOfBirthErrors[0].desc),
      200
    );
  }

  //Email verification
  const emailErrors = await checkEmail(email);
  if (emailErrors.length > 0) {
    throw new SignupException(
      'Bad signup attempt',
      errorDescription(1, emailErrors[0].field, emailErrors[0].desc),
      200
    );
  }

  //Username verification
  const usernameErrors = await checkUsername(username);
  if (usernameErrors.length > 0) {
    throw new SignupException(
      'Bad signup attempt',
      errorDescription(2, usernameErrors[0].field, usernameErrors[0].desc),
      200
    );
  }

  //Password verification
  const passwordErrors = checkPassword(password);
  if (passwordErrors.length > 0) {
    throw new SignupException(
      'Bad signup attempt',
      errorDescription(2, passwordErrors[0].field, passwordErrors[0].desc),
      200
    );
  }
};
