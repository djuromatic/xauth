import mongoose, { Schema } from 'mongoose';

export interface UnverifiedEmailLoginAttemptDocument {
  accountId: string;
  interactionId: string;
  expiresAt: Date;
}

const unverifiedEmailLoginAttemptSchema = new Schema<UnverifiedEmailLoginAttemptDocument>({
  accountId: { type: String, required: true, unique: false },
  interactionId: { type: String, required: true, unique: false },
  expiresAt: { type: Date, default: Date.now }
});

export default mongoose.model<UnverifiedEmailLoginAttemptDocument>(
  'UnverifiedEmailLoginAttempt',
  unverifiedEmailLoginAttemptSchema
);
