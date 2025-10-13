import ItineraryModel, { Itinerary } from "../models/Itinerary";

export const findAllItineraries = async () => {
  return await ItineraryModel.find();
};
export const findAllItinerariesByUserId = async (userId: string) => {
  return await ItineraryModel.find({ userId: userId });
};
export const findItineraryByUserId = async (userId: string) => {
  return await ItineraryModel.findOne({ userId: userId });
};
export const findItineraryById = async (ItineraryId: string) => {
  return await ItineraryModel.findById({ _id: ItineraryId });
};
export const findItineraryByIdAndUserId = async (
  ItineraryId: string,
  userId: string
) => {
  return await ItineraryModel.findOne({ _id: ItineraryId, userId: userId });
};

export const createItinerary = async (Itinerary: Partial<Itinerary>) => {
  return await ItineraryModel.create(Itinerary);
};
export const updateItineraryById = async (
  ItineraryId: string,
  Itinerary: Partial<Itinerary>
) => {
  return await ItineraryModel.findByIdAndUpdate(
    { _id: ItineraryId },
    Itinerary,
    {
      new: true,
      runValidators: true,
    }
  );
};
export const updateItineraryByIdAndUserId = async (
  ItineraryId: string,
  userId: string,
  Itinerary: Partial<Itinerary>
) => {
  return await ItineraryModel.findOneAndUpdate(
    { _id: ItineraryId, userId: userId },
    Itinerary,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const deleteItineraryById = async (ItineraryId: string) => {
  return await ItineraryModel.findByIdAndDelete({ _id: ItineraryId });
};
