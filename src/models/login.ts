import mongoose, { Schema } from 'mongoose';

export interface SsoLoginDocument {
  uid: string;
  code_verifier: string;
  nonce: string;
  state: string;
}

const ssoLoginSchema = new Schema<SsoLoginDocument>({
  uid: { type: String, required: true, unique: true },
  code_verifier: { type: String, required: true },
  nonce: { type: String, required: true },
  state: { type: String, required: true }
});

//export model user with UserSchema
export default mongoose.model<SsoLoginDocument>('SsoLogin', ssoLoginSchema);
