import crypto from 'crypto';

import { SesService } from '../utils/aws/email/ses.js';

export const generateEmailCode = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendEmail = async (email: string, username: string, link: string) => {
  const emailService = new SesService();
  const subject = `Xlantis Email Verification ${username}`;
  const body =
    `Wecome to XLANTIS!\n\n` +
    `Thank you for signing up! Please secure your account for ${username} by confirming your email address.\n` +
    `Please click the link bellow to complete the verification process for ${username}.\n\n` +
    `${link}\n\n` +
    `See you in XLANTIS!\n` +
    `-The XLANTIS Team`;

  //TODO: send the actual email
  emailService.sendTextEmail([email], subject, body);
};
