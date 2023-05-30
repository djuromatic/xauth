import mongoose, { Schema } from 'mongoose';

export interface RoleDocument {
  uid: string;
  name: string;
  permissionIds: string[];
}

const roleSchema = new Schema<RoleDocument>({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  permissionIds: { type: [String], required: true, unique: false }
});

//export model user with UserSchema
export default mongoose.model<RoleDocument>('Role', roleSchema);
