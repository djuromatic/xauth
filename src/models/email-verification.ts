import mongoose, { Schema } from 'mongoose';

export interface EmailVerificationDocument {
  accountId: string;
  code: string;
  expiresAt: Date;
}

const emailVerificationSchema = new Schema<EmailVerificationDocument>({
  accountId: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  expiresAt: { type: Date, default: Date.now }
});

//export model user with UserSchema
export default mongoose.model<EmailVerificationDocument>('EmailVerification', emailVerificationSchema);
