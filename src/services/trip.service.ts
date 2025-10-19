import { Response } from "express";
import TripModel, { Trip } from "../models/Trip";
import { HttpStatus } from "../types/httpStatus";
import { sendError } from "../utils/apiResponseFormat";
import { parseDateString } from "../utils/dateHelper";

export const findAllTrips = async () => {
  return await TripModel.find().sort({ createdAt: -1 });
};
export const findAllTripsByUserId = async (userId: string) => {
  return await TripModel.find({ userId: userId }).sort({ createdAt: -1 });
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

export const amadeusOffersDateValidation = async (
  res: Response,
  tripId: any,
  startDate: any,
  endDate: any
) => {
  // Validate dates - parse date strings without timezone conversion
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const departure = parseDateString(startDate as string);
  const returnDate = parseDateString(endDate as string);

  // Check if departure is in the past
  if (departure < today) {
    if (tripId) {
      await TripModel.findByIdAndUpdate(tripId, {
        $set: {
          validationStatus: {
            isValid: false,
            reason: `Departure date (${
              departure.toISOString().split("T")[0]
            }) is in the past`,
            lastChecked: new Date(),
          },
        },
      });
    }
    return sendError(
      res,
      "Departure date cannot be in the past",
      HttpStatus.BAD_REQUEST
    );
  }

  // Check if departure is too soon (Amadeus requires at least 1 day notice)
  const minDeparture = new Date(today);
  minDeparture.setDate(minDeparture.getDate() + 1);
  if (departure < minDeparture) {
    if (tripId) {
      await TripModel.findByIdAndUpdate(tripId, {
        $set: {
          validationStatus: {
            isValid: false,
            reason: `Departure date (${
              departure.toISOString().split("T")[0]
            }) is too soon. Flights must be booked at least 1 day in advance`,
            lastChecked: new Date(),
          },
        },
      });
    }
    return sendError(
      res,
      "Departure date must be at least 1 day in the future",
      HttpStatus.BAD_REQUEST
    );
  }

  // Check if return date is before departure
  if (returnDate <= departure) {
    if (tripId) {
      await TripModel.findByIdAndUpdate(tripId, {
        $set: {
          validationStatus: {
            isValid: false,
            reason: "Return date must be after departure date",
            lastChecked: new Date(),
          },
        },
      });
    }
    return sendError(
      res,
      "Return date must be after departure date",
      HttpStatus.BAD_REQUEST
    );
  }
};
