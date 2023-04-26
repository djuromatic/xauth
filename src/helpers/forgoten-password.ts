import crypto from 'crypto';

import { SesService } from '../utils/aws/email/ses.js';

export const generateEmailCode = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendEmail = async (email: string, username: string, link: string) => {
  const emailService = new SesService();
  const subject = 'Reset your Xlantis Account';
  const body =
    `Hello ${username}\n\n` +
    `A request to reset your password has been submitted.\n` +
    `If this request was not made by you please change your XLANTIS account password immediately from the My Profile Section to secure your account.\n\n` +
    `If this reset request was made by you plase follow this link: ${link}\n\n` +
    `to reset your password. Once reset you should be able to successfully sign in to your XLANTIS account with your new credentials.\n\n` +
    `See you in XLANTIS!\n` +
    `-The XLANTIS Team`;

  //TODO: send the actual email
  emailService.sendTextEmail([email], subject, body);
};
