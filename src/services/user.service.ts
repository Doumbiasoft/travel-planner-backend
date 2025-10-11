import UserModel, { User } from "../models/User";

export const findAllUsers = async () => {
  return await UserModel.find();
};
export const findUser = async (email?: string) => {
  let filter: any = {};
  if (email) {
    filter.email = email?.toString().trim().toLowerCase();
  }
  return await UserModel.findOne(filter);
};
export const findUserById = async (userId: string) => {
  return await UserModel.findById({ _id: userId });
};
export const createUser = async (user: Partial<User>) => {
  return await UserModel.create(user);
};
export const updateUserById = async (userId: string, user: Partial<User>) => {
  return await UserModel.findByIdAndUpdate({ _id: userId }, user, {
    new: true,
    runValidators: true,
  });
};
export const deleteUserById = async (userId: string) => {
  return await UserModel.findByIdAndDelete({ _id: userId });
};
