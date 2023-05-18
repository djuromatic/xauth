import { findByEmail, findByUsername } from '../service/account.service.js';

import { MIN_AGE_REQUIRED } from './constants.js';

export const checkDateOfBirth = (dateOfBirth: string) => {
  const errors = [];
  if (!dateOfBirth) {
    errors.push({ field: 'dateOfBirth', desc: 'Date of birth not provided' });
  }

  if (Date.now() - Date.parse(dateOfBirth) < MIN_AGE_REQUIRED) {
    errors.push({ field: 'dateOfBirth', desc: 'Under the minimum age requiered' });
  }
  return errors;
};
export const checkEmail = async (email: string) => {
  const errors = [];

  if (!email) {
    errors.push({ field: 'email', desc: 'Email not provided' });
  }

  if (!email.includes('@') || !email.includes('.')) {
    errors.push({ field: 'email', desc: 'Not a valid email' });
  }

  const account = await findByEmail(email);
  if (account) {
    errors.push({ field: 'email', desc: 'Email already in use' });
  }

  return errors;
};

export const checkUsername = async (username: string) => {
  const errors = [];

  if (!username) {
    errors.push({ field: 'username', desc: 'Username not provided' });
  }

  if (username.length < 3) {
    errors.push({ field: 'username', desc: 'Username length must be above 3 characters' });
  }

  if (username.length > 16) {
    errors.push({ field: 'username', desc: 'Username length must be bellow 16 characters' });
  }

  if (!isAlphanumeric(username)) {
    errors.push({ field: 'username', desc: 'Username must contain only alphanumeric characters' });
  }

  if (await findByUsername(username)) {
    errors.push({ field: 'username', desc: 'Username already registered' });
  }

  return errors;
};

export const checkPassword = (password: string) => {
  const errors = [];

  if (!password) {
    errors.push({ field: 'password', desc: 'Password not provided' });
  }

  if (password.length < 8) {
    errors.push({ field: 'password', desc: 'Password length must be above 8 characters' });
  }

  if (password.length > 16) {
    errors.push({ field: 'password', desc: 'Password length must be bellow 16 characters' });
  }

  if (!hasLowerCaseLetter(password)) {
    errors.push({ field: 'password', desc: 'Password must contain minimum one lowercase letter' });
  }

  if (!hasTwoUpperCaseLetters(password)) {
    errors.push({ field: 'password', desc: 'Password must contain minimum two uppercase letters' });
  }

  if (!hasNumeric(password)) {
    errors.push({ field: 'password', desc: 'Password must contain at least one number' });
  }
  return errors;
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
