import mongoose, { Schema } from 'mongoose';

export interface PermissionDocument {
  uid: string;
  name: string;
}

const permissionSchema = new Schema<PermissionDocument>({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true }
});

//export model user with UserSchema
export default mongoose.model<PermissionDocument>('Permission', permissionSchema);
