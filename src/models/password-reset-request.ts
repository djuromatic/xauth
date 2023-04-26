import mongoose, { Schema } from 'mongoose';

export interface PasswordResetRequestDocument {
  accountId: string;
  code: string;
  expiresAt: Date;
}

const passwordResetRequestSchema = new Schema<PasswordResetRequestDocument>({
  accountId: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  expiresAt: { type: Date, default: Date.now }
});

//export model user with PasswordResetRequest
export default mongoose.model<PasswordResetRequestDocument>('PasswordResetRequest', passwordResetRequestSchema);
