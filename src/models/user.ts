import { Schema, Document, Types, model } from "mongoose";
import bcrypt from "bcrypt";

interface UserPass extends Document {
  email: string;
  password: string;
  emailVerified: boolean;
  isValidPassword(password: string): Promise<boolean>;
}

const EmailPasswordSchema = new Schema({
  id: Types.ObjectId,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
});

EmailPasswordSchema.pre<UserPass>("save", async function (next) {
  const user = this;

  // if (!user.isModified("password")) {
  //   return next();
  // }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

EmailPasswordSchema.methods.isValidPassword = async function (
  password: string
) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);

  return compare;
};

const EmailPasswordModel = model<UserPass>(
  "EmailPasswordModel",
  EmailPasswordSchema
);

export { EmailPasswordModel };
