import mongoose, { Schema } from 'mongoose';

export interface DemoAccountDocument {
  _id: string;
  accountId?: string;
  fingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

const demoAccountSchema = new Schema<DemoAccountDocument>({
  _id: { type: String, required: true },
  accountId: { type: String, required: false, unique: true },
  fingerprint: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now } //todo change to detect this only on update
});

//export model user with UserSchema
export default mongoose.model<DemoAccountDocument>('DemoAccount', demoAccountSchema);
