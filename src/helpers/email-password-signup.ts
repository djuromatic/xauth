import { findByEmail, findByUsername } from '../service/account.service.js';
import { SignupException } from '../common/errors/exceptions.js';
import { MIN_AGE_REQUIRED, PASSWORD_SALT_ROUNDS } from './constants.js';

export const check = async (reqBody: Request['body']) => {
  const { email, password, dateOfBirth, username } = reqBody as any;

  //Age related verification
  if (!dateOfBirth) {
    throw new SignupException('Bad signup attempt', 'Date of birth not provided', 200);
  }

  if (Date.now() - Date.parse(dateOfBirth) < MIN_AGE_REQUIRED) {
    throw new SignupException('Bad signup attempt', "You're younger than 16 years", 200);
  }

  //Password verification
  passwordChecks(password);

  //Username verification
  if (!username) {
    throw new SignupException('Bad signup attempt', 'Username not provided', 200);
  }

  if (username.length < 3) {
    throw new SignupException('Bad signup attempt', 'Username length must be above 3 characters', 200);
  }

  if (username.length > 16) {
    throw new SignupException('Bad signup attempt', 'Username length must be bellow 16 characters', 200);
  }

  if (!isAlphanumeric(username)) {
    throw new SignupException('Bad signup attempt', 'Username must contain only alphanumeric characters', 200);
  }

  if (await findByUsername(username)) {
    throw new SignupException('Bad signup attempt', 'Username already exists', 200);
  }

  //Email verification
  if (!email) {
    throw new SignupException('Bad signup attempt', 'Email not provided', 200);
  }

  if (!email.includes('@') || !email.includes('.')) {
    throw new SignupException('Bad signup attempt', 'Not a valid email', 200);
  }

  const account = await findByEmail(email);
  if (account) {
    throw new SignupException('Bad signup attempt', 'Email already in use', 200);
  }
};

export const passwordChecks = (password: string) => {
  //Password verification
  if (!password) {
    throw new SignupException('Bad signup attempt', 'Password not provided', 200);
  }

  if (password.length < 8) {
    throw new SignupException('Bad signup attempt', 'Password length must be above 8 characters', 200);
  }

  if (password.length > 16) {
    throw new SignupException('Bad signup attempt', 'Password length must be bellow 16 characters', 200);
  }

  if (!hasLowerCaseLetter(password)) {
    throw new SignupException('Bad signup attempt', 'Password must contain minimum one lowercase letter', 200);
  }

  if (!hasTwoUpperCaseLetters(password)) {
    throw new SignupException('Bad signup attempt', 'Password must contain minimum two uppercase letters', 200);
  }

  if (!hasNumeric(password)) {
    throw new SignupException('Bad signup attempt', 'Password must contain minimum one number', 200);
  }
};

const isAlphanumeric = (str: string) => {
  return str.match(/^[a-zA-Z0-9]+$/) !== null;
};

const hasLowerCaseLetter = (str: string) => {
  return /[a-z]/.test(str);
};

const hasTwoUpperCaseLetters = (str: string) => {
  var count = 0,
    len = str.length;
  for (var i = 0; i < len; i++) {
    if (/[A-Z]/.test(str.charAt(i))) count++;
  }
  return count > 1;
};

const hasNumeric = (str: string) => {
  return /[0-9]/.test(str);
};
