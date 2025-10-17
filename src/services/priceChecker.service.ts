import Trip from "../models/Trip";
import User from "../models/User";
import { amadeus } from "../config/amadeus";
import { saveEmailBox } from "./mailbox.service";
import { logger } from "../utils/logger";
import { formatPriceWithSymbol } from "../utils/currency";
import { readEmailTemplateContent } from "../utils/emailTemplateReader";
import { PRICE_DROP_NOTIFICATION_TEMPLATE } from "../utils/constantEmailTemplatesNames";

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
      return null;
    }

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: trip.originCityCode,
      destinationLocationCode: trip.destinationCityCode,
      departureDate: new Date(trip.startDate).toISOString().split("T")[0],
      returnDate: new Date(trip.endDate).toISOString().split("T")[0],
      adults: "1",
      max: 7,
      currencyCode: "USD",
    });

    return response.data || [];
  } catch (error: any) {
    logger.error(`Failed to fetch prices for trip ${trip._id}:`, error.message);
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

// Move the flag outside the function to persist across calls
let checkingPrices = false;

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
      new Date(trip.startDate).toLocaleDateString() +
      " - " +
      new Date(trip.endDate).toLocaleDateString();

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
  if (checkingPrices) {
    logger.warn("Price checker skipped: previous job still running");
    return;
  }

  checkingPrices = true;

  try {
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
        // Skip if trip end date has passed
        const now = new Date();
        const tripEndDate = new Date(trip.endDate);
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
        const currentFlights = await fetchCurrentFlightPrices(trip);

        if (!currentFlights) {
          logger.warn(
            `Failed to fetch current prices for trip ${trip._id}, skipping...`
          );
          continue;
        }

        // Compare old and new prices
        const priceComparison = comparePrices(
          trip.flightOptions as any[],
          currentFlights,
          0.05 // 5% threshold
        );

        if (!priceComparison || !priceComparison.priceDropped) {
          logger.info(
            `No significant price drop for trip ${trip._id} (${trip.tripName})`
          );
          continue;
        }

        // Get user information
        const user = await User.findById(trip.userId);

        if (!user) {
          logger.warn(`User not found for trip ${trip._id}, skipping...`);
          continue;
        }

        // Send notification
        await sendPriceDropNotification(user, trip, {
          ...priceComparison,
          tripId: trip._id.toString(),
          tripName: trip.tripName,
        });

        // Update trip with new flight options
        await Trip.findByIdAndUpdate(trip._id, {
          $set: {
            flightOptions: currentFlights.slice(0, 6),
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
      }
    }

    logger.info(
      `Price checker completed. Sent ${notificationsSent} notifications out of ${trips.length} trips checked.`
    );
  } catch (error: any) {
    logger.error("Price checker cron job failed:", error.message);
  } finally {
    checkingPrices = false;
  }
};
