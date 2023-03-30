import { EmailPasswordModel } from "../../models";

export const getUserProfile = async (email: string) => {
  const user = EmailPasswordModel.findOne({ email });

  return user;
};
