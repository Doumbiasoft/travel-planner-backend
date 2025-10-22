import Trip from "../models/Trip";
import { amadeus } from "../config/amadeus";
import { saveEmailBox } from "./mailbox.service";
import { logger } from "../utils/logger";
import { formatPriceWithSymbol } from "../utils/currency";
import { readEmailTemplateContent } from "../utils/emailTemplateReader";
import { PRICE_DROP_NOTIFICATION_TEMPLATE } from "../utils/constantEmailTemplatesNames";
import { parseDateString, formatDateToString, formatDateForDisplay } from "../utils/dateHelper";

interface PriceCheckResult {
  tripId: string;
  tripName: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  percentageChange: number;
  priceDropped: boolean;
}

const getFlightPrice = (flight: any): number => {
  if (!flight) return 0;
  if (typeof flight.price === "object") {
    return Number(flight.price?.total || 0);
  }
  return Number(flight.price || 0);
};

const getFlightCurrency = (flight: any): string => {
  if (!flight) return "USD";
  if (typeof flight.price === "object") {
    return flight.price?.currency || "USD";
  }
  return "USD";
};

export const fetchCurrentFlightPrices = async (trip: any) => {
  try {
    if (
      !trip.originCityCode ||
      !trip.destinationCityCode ||
      !trip.startDate ||
      !trip.endDate
    ) {
      logger.warn(`Trip ${trip._id} missing required fields for price check`);
      await Trip.findByIdAndUpdate(trip._id, {
        $set: {
          validationStatus: {
            isValid: false,
            reason: "Missing required fields (origin, destination, or dates)",
            lastChecked: new Date(),
          },
        },
      });
      return null;
    }

    // Validate dates before calling Amadeus
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const departure = parseDateString(trip.startDate);
    const returnDate = parseDateString(trip.endDate);

    // Check if departure is in the past
    if (departure < today) {
      logger.warn(
        `Trip ${trip._id} (${trip.tripName}) has departure date in the past (${
          departure.toISOString().split("T")[0]
        }), skipping price check`
      );
      await Trip.findByIdAndUpdate(trip._id, {
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
      return null;
    }

    // Check if return date has passed
    if (returnDate < today) {
      logger.warn(
        `Trip ${trip._id} (${trip.tripName}) has return date in the past (${
          returnDate.toISOString().split("T")[0]
        }), skipping price check`
      );
      await Trip.findByIdAndUpdate(trip._id, {
        $set: {
          validationStatus: {
            isValid: false,
            reason: `Return date (${
              returnDate.toISOString().split("T")[0]
            }) is in the past`,
            lastChecked: new Date(),
          },
        },
      });
      return null;
    }

    // Check if departure is too soon (Amadeus requires at least 1 day notice)
    const minDeparture = new Date(today);
    minDeparture.setDate(minDeparture.getDate() + 1);
    if (departure < minDeparture) {
      logger.warn(
        `Trip ${trip._id} (${trip.tripName}) departs too soon (${
          departure.toISOString().split("T")[0]
        }), Amadeus requires at least 1 day notice, skipping price check`
      );
      await Trip.findByIdAndUpdate(trip._id, {
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
      return null;
    }

    // Fetch flights
    const flightSearchParams: any = {
      originLocationCode: trip.originCityCode,
      destinationLocationCode: trip.destinationCityCode,
      departureDate: formatDateToString(trip.startDate),
      returnDate: formatDateToString(trip.endDate),
      adults: trip.preferences?.adults?.toString() || "1",
      max: 7,
      currencyCode: "USD",
    };

    // Only add optional parameters if they have valid values
    if (trip.preferences?.children && trip.preferences.children > 0) {
      flightSearchParams.children = trip.preferences.children.toString();
    }
    if (trip.preferences?.infants && trip.preferences.infants > 0) {
      flightSearchParams.infants = trip.preferences.infants.toString();
    }
    if (trip.preferences?.travelClass) {
      flightSearchParams.travelClass = trip.preferences.travelClass;
    }

    const flightsResponse = await amadeus.shopping.flightOffersSearch.get(
      flightSearchParams
    );

    // Fetch hotels
    const hotelsResponse = await amadeus.referenceData.locations.hotels.byCity
      .get({
        cityCode: trip.destinationCityCode,
      })
      .catch(() => ({ data: [] }));

    // If successful, mark as valid
    await Trip.findByIdAndUpdate(trip._id, {
      $set: {
        validationStatus: {
          isValid: true,
          reason: null,
          lastChecked: new Date(),
        },
      },
    });

    return {
      flights: flightsResponse.data || [],
      hotels: hotelsResponse.data || [],
    };
  } catch (error: any) {
    logger.error(`Error Object:`, JSON.stringify(error));
    console.log(`Error Object 2 :`, error);
    console.log(`Error Object 3 :`, JSON.stringify(error));

    const errorMessage = error.message || error.description || "Unknown error";
    logger.error(`Failed to fetch prices for trip ${trip._id}:`, errorMessage);

    // Log error properties 
    logger.error(`Error type: ${error.constructor?.name || typeof error}`);
    if (error.code) logger.error(`Error code: ${error.code}`);
    if (error.status) logger.error(`Error status: ${error.status}`);
    if (error.statusCode) logger.error(`Error statusCode: ${error.statusCode}`);
    if (error.response) {
      logger.error(`Response data:`, error.response.data || error.response);
    }
    if (error.stack) {
      logger.error(
        `Stack trace: ${error.stack.split("\n").slice(0, 3).join("\n")}`
      );
    }

    // Log all error keys
    logger.error(`Error keys: ${Object.keys(error).join(", ")}`);

    await Trip.findByIdAndUpdate(trip._id, {
      $set: {
        validationStatus: {
          isValid: false,
          reason: `API error: ${errorMessage}`,
          lastChecked: new Date(),
        },
      },
    });
    return null;
  }
};

export const comparePrices = (
  oldFlights: any[],
  newFlights: any[],
  threshold: number = 0.05 // 5% drop threshold
): PriceCheckResult | null => {
  if (!oldFlights?.length || !newFlights?.length) return null;

  // Get the cheapest flight from old options
  const oldPrices = oldFlights.map(getFlightPrice).filter((p) => p > 0);
  const oldPrice = Math.min(...oldPrices);

  // Get the cheapest flight from new options
  const newPrices = newFlights.map(getFlightPrice).filter((p) => p > 0);
  const newPrice = Math.min(...newPrices);

  if (oldPrice === 0 || newPrice === 0) return null;

  const currency = getFlightCurrency(newFlights[0]);
  const percentageChange = ((oldPrice - newPrice) / oldPrice) * 100;
  const priceDropped = percentageChange >= threshold * 100;

  return {
    tripId: "",
    tripName: "",
    oldPrice,
    newPrice,
    currency,
    percentageChange,
    priceDropped,
  };
};

export const sendPriceDropNotification = async (
  user: any,
  trip: any,
  priceInfo: PriceCheckResult
) => {
  try {
    const { oldPrice, newPrice, currency, percentageChange } = priceInfo;

    const subject = `🎉 Price Drop Alert: ${trip.tripName}`;
    const tripName = trip.tripName;
    const previousPrice = formatPriceWithSymbol(oldPrice, currency);
    const newFoundPrice = formatPriceWithSymbol(newPrice, currency);
    const moneySave =
      formatPriceWithSymbol(oldPrice - newPrice, currency) +
      " " +
      percentageChange.toFixed(1) +
      "%";

    const destination = trip.destination || "N/A";

    const dates =
      formatDateForDisplay(trip.startDate) +
      " - " +
      formatDateForDisplay(trip.endDate);

    const name = user.firstName.toString().split(" ")[0];
    let template: any = await readEmailTemplateContent(
      PRICE_DROP_NOTIFICATION_TEMPLATE
    );
    template = template
      .replaceAll("%Name%", name)
      .replace("%TripName%", tripName)
      .replace("%PreviousPrice%", previousPrice)
      .replace("%NewPrice%", newFoundPrice)
      .replace("%MoneySave%", moneySave)
      .replace("%Destination%", destination)
      .replace("%Dates%", dates);

    await saveEmailBox({
      to: { name: user.firstName + " " + user.lastName, email: user.email },
      subject,
      content: template,
    });

    logger.info(
      `Price drop notification sent to ${user.email} for trip ${trip.tripName}`
    );
  } catch (error: any) {
    logger.error(
      `Failed to send price drop notification for trip ${trip._id}:`,
      error.message
    );
  }
};

export const checkPricesForAllTrips = async () => {
  logger.info("Starting price checker cron job...");

  const now = new Date();

  // Find all trips with price drop notifications enabled and end date in the future
  const trips = await Trip.find({
    "notifications.priceDrop": true,
    "notifications.email": true,
    endDate: { $gte: now }, // Only trips that haven't ended yet
  }).populate("userId");

  if (!trips.length) {
    logger.info("No trips found with price drop notifications enabled");
    return;
  }

  logger.info(`Checking prices for ${trips.length} trips...`);

  let notificationsSent = 0;

  for (const trip of trips) {
    try {
      // Validate user is populated
      if (!trip.userId || typeof trip.userId === 'string') {
        logger.warn(`User not populated for trip ${trip._id}, skipping...`);
        continue;
      }

      const user = trip.userId as any;

      // Skip if trip end date has passed
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const tripEndDate = parseDateString(trip.endDate);
      if (tripEndDate < now) {
        logger.info(
          `Trip ${trip._id} (${
            trip.tripName
          }) has already ended on ${tripEndDate.toLocaleDateString()}, skipping...`
        );
        continue;
      }

      // Skip if trip doesn't have flight options stored
      if (!trip.flightOptions?.length) {
        logger.warn(
          `Trip ${trip._id} (${trip.tripName}) has no stored flight options, skipping...`
        );
        continue;
      }

      // Fetch current prices from Amadeus API
      const currentOffers = await fetchCurrentFlightPrices(trip);

      if (!currentOffers) {
        logger.warn(
          `Failed to fetch current prices for trip ${trip._id}, skipping...`
        );
        continue;
      }

      // Compare old and new prices
      const priceComparison = comparePrices(
        trip.flightOptions as any[],
        currentOffers.flights,
        0.05 // 5% threshold
      );

      if (!priceComparison || !priceComparison.priceDropped) {
        logger.info(
          `No significant price drop for trip ${trip._id} (${trip.tripName})`
        );
        continue;
      }

      // Validate user has required fields
      if (!user.email || !user.firstName || !user.lastName) {
        logger.warn(`User ${user._id} missing required fields for notification, skipping...`);
        continue;
      }

      // Send notification
      await sendPriceDropNotification(user, trip, {
        ...priceComparison,
        tripId: trip._id.toString(),
        tripName: trip.tripName,
      });

      // Update trip with new flight and hotel options
      await Trip.findByIdAndUpdate(trip._id, {
        $set: {
          flightOptions: currentOffers.flights.slice(0, 6),
          hotelOptions: currentOffers.hotels.slice(0, 6),
        },
      });

      notificationsSent++;

      logger.info(
        `Price drop detected for trip ${trip._id} (${trip.tripName}): ${
          priceComparison.oldPrice
        } -> ${
          priceComparison.newPrice
        } (${priceComparison.percentageChange.toFixed(1)}% drop)`
      );
    } catch (error: any) {
      logger.error(
        `Error checking prices for trip ${trip._id}:`,
        error.message
      );
      logger.error(`Full error stack:`, error.stack);
    }
  }

  logger.info(
    `Price checker completed. Sent ${notificationsSent} notifications out of ${trips.length} trips checked.`
  );
};
