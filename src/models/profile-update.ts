import mongoose, { Schema } from 'mongoose';

export interface ProfileUpdateDocument {
  accountId: string;
  code: string;
  expiresAt: Date;
}

const profileUpdateSchema = new Schema<ProfileUpdateDocument>({
  accountId: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  expiresAt: { type: Date, default: Date.now }
});

//export model user with UserSchema
export default mongoose.model<ProfileUpdateDocument>('ProfileUpdate', profileUpdateSchema);
