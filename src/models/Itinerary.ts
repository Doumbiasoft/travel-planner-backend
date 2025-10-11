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

export interface Itinerary extends Document {
  _id: string;
  userId: string;
  tripName: string;
  destination: String;
  cityCode: String;
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
  collaborators: [string];
  createdAt: Date;
}
export type Itineraries = Itinerary[];

const eventSchema = new Schema({
  kind: {
    type: String,
    enum: ["flight", "hotel", "activity", "dining", "transport"],
    required: true,
  },
  title: String,
  startTime: Date,
  endTime: Date,
  cost: { type: Number, default: 0 },
  location: {
    lat: Number,
    lng: Number,
    address: String,
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
      require: true,
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
    destination: String,
    cityCode: String,
    startDate: Date,
    endDate: Date,
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
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ItineraryModel: Model<Itinerary> = mongoose.model<Itinerary>(
  "Itinerary",
  itinerarySchema
);

export default ItineraryModel;
