import crypto from 'crypto';
export const generateEmailCode = () => {
  return crypto.randomBytes(32).toString('hex');
};
