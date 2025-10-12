import ItineraryModel from "../models/Itinerary";
import UserModel, { User } from "../models/User";

export const findAllUsers = async () => {
  return await UserModel.find();
};
export const findUser = async (email?: string, isActive?: boolean) => {
  let filter: any = {};
  if (email) {
    filter.email = email?.toString().trim().toLowerCase();
  }
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }
  return await UserModel.findOne(filter);
};
export const findUserById = async (userId: string) => {
  return await UserModel.findById({ _id: userId });
};
export const findUserByIdWithoutPassword = async (userId: string) => {
  return await UserModel.findById({ _id: userId }).select("-password");
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
export const updateUserByActivationToken = async (
  activationToken: string,
  user: Partial<User>
) => {
  return await UserModel.findOneAndUpdate(
    { activationToken: activationToken },
    user,
    {
      new: true,
      runValidators: true,
    }
  );
};
export const deleteUserById = async (userId: string) => {
  return await UserModel.findByIdAndDelete({ _id: userId });
};
export const deleteUserAccount = async (email: string) => {
  const session = await UserModel.db.startSession();
  session.startTransaction();
  try {
    const user = await findUser(email);
    await ItineraryModel.deleteMany({ userId: user?._id }, { session });
    const deletedUser = await UserModel.findOneAndDelete(
      { email: email },
      { session }
    );
    await session.commitTransaction();
    await session.endSession();
    return deletedUser;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
  }
};
