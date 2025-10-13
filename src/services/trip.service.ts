import TripModel, { Trip } from "../models/Trip";

export const findAllTrips = async () => {
  return await TripModel.find();
};
export const findAllTripsByUserId = async (userId: string) => {
  return await TripModel.find({ userId: userId });
};
export const findTripByUserId = async (userId: string) => {
  return await TripModel.findOne({ userId: userId });
};
export const findTripById = async (tripId: string) => {
  return await TripModel.findById({ _id: tripId });
};
export const findTripByIdAndUserId = async (tripId: string, userId: string) => {
  return await TripModel.findOne({ _id: tripId, userId: userId });
};

export const createTrip = async (trip: Partial<Trip>) => {
  return await TripModel.create(trip);
};
export const updateTripById = async (tripId: string, trip: Partial<Trip>) => {
  return await TripModel.findByIdAndUpdate({ _id: tripId }, trip, {
    new: true,
    runValidators: true,
  });
};
export const updateTripByIdAndUserId = async (
  tripId: string,
  userId: string,
  trip: Partial<Trip>
) => {
  return await TripModel.findOneAndUpdate(
    { _id: tripId, userId: userId },
    trip,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const deleteTripById = async (tripId: string) => {
  return await TripModel.findByIdAndDelete({ _id: tripId });
};
export const deleteTripByIdAndUserId = async (
  tripId: string,
  userId: string
) => {
  return await TripModel.findOneAndDelete({
    _id: tripId,
    userId: userId,
  });
};

export const findAllMarkersByTripIdAndUserId = async (
  tripId: string,
  userId: string
) => {
  const trip = await TripModel.findOne({ _id: tripId, userId: userId });
  return trip?.markers || [];
};

export const createAMarker = async (
  tripId: string,
  userId: string,
  data: { lat: number; lng: number; label: string }
) => {
  const trip = await TripModel.findOneAndUpdate(
    { _id: tripId, userId: userId },
    { $push: { markers: data } },
    { new: true }
  );
  return trip?.markers || [];
};
