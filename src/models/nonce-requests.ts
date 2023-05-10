import mongoose, { Schema } from 'mongoose';

export interface NonceRequestDocument {
  interactionId: string;
  nonce: string;
  expiresAt: Date;
}

const nonceRequestSchema = new Schema<NonceRequestDocument>({
  interactionId: { type: String, required: true, unique: true },
  nonce: { type: String, required: true, unique: true },
  expiresAt: { type: Date, default: Date.now }
});

//export model user with UserSchema
export default mongoose.model<NonceRequestDocument>('NonceRequest', nonceRequestSchema);
