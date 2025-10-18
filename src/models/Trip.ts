import mongoose, { Schema, Document, Model } from "mongoose";

interface Event extends Document {
  _id: string;
  kind: ["flight", "hotel", "activity", "dining", "transport"];
  title: string;
  startTime: Date;
  endTime: Date;
  cost: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  meta: unknown;
}
interface Day extends Document {
  _id: string;
  date: Date;
  events: [Event];
}

interface Marker extends Document {
  _id: string;
  lat: number;
  lng: number;
  label: string;
}

export interface Trip extends Document {
  _id: string;
  userId: string;
  tripName: string;
  origin: string;
  originCityCode: String;
  destination: String;
  destinationCityCode: String;
  startDate: Date;
  endDate: Date;
  budget: number;
  days: [Day];
  markers: [Marker];
  preferences: {
    flexibleDates: boolean;
    maxStops: number;
  };
  flightOptions: [unknown];
  hotelOptions: [unknown];
  notifications: {
    priceDrop: boolean;
    email: boolean;
  };
  validationStatus: {
    isValid: boolean;
    reason: string | null;
    lastChecked: Date | null;
  };
  collaborators: [string];
  createdAt: Date;
  updatedAt: Date;
}
export type Trips = Trip[];

const eventSchema = new Schema({
  kind: {
    type: String,
    enum: ["flight", "hotel", "activity", "dining", "transport"],
    required: true,
  },
  title: { type: String, required: true },
  startTime: { type: Date, required: false },
  endTime: { type: Date, required: false },
  cost: { type: Number, default: 0 },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
  },
  meta: Schema.Types.Mixed,
});

const daySchema = new Schema({
  date: Date,
  events: [eventSchema],
});

const markerSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  label: { type: String },
});

const itinerarySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: async function (userId: Schema.Types.ObjectId) {
          // Query the database to see if the user exists
          const user = await mongoose.models.User.findById({ _id: userId });
          // Return false if no user is found
          return !!user;
        },
        message: (props: any) =>
          `This user with ${props.path}: (${props.value}) does not exit.`,
      },
    },

    tripName: { type: String, required: true },
    origin: { type: String, required: true },
    originCityCode: { type: String, required: true },
    destination: { type: String, required: true },
    destinationCityCode: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: Number, min: 0, default: 0 },
    days: [daySchema],
    markers: [markerSchema],
    preferences: {
      flexibleDates: { type: Boolean, default: false },
      maxStops: { type: Number, default: 2 },
    },
    flightOptions: [Schema.Types.Mixed],
    hotelOptions: [Schema.Types.Mixed],
    notifications: {
      priceDrop: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    validationStatus: {
      isValid: { type: Boolean, default: true },
      reason: { type: String, default: null },
      lastChecked: { type: Date, default: null },
    },
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const TripModel: Model<Trip> = mongoose.model<Trip>("Trip", itinerarySchema);

export default TripModel;
