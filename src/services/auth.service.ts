import UserModel, { User } from "../models/User";

export const createUser = async (user: Partial<User>) => {
  return await UserModel.create(user);
};

export const findUser = async (email?: string) => {
  let filter: any = {};
  if (email) {
    filter.email = email?.toString().trim().toLowerCase();
  }
  return await UserModel.findOne(filter);
};
