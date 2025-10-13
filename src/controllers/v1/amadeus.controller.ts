import { Request, Response } from "express";
import { sendResponse, sendError } from "../../utils/apiResponseFormat";
import { Router, Get, Use, Req, Res } from "@reflet/express";
import { HttpStatus } from "../../types/httpStatus";
import { logRequest } from "../../middlewares/logging.middleware";
import { endpointMetadata } from "../../middlewares/endpointMetadata.middleware";
import { buildRoute } from "../../config/apiPrefix";
import authMiddleware from "../../middlewares/auth.middleware";
import { amadeus } from "../../config/amadeus";
import { validateQuery } from "../../middlewares/validation.middleware";
import { findBestPackage } from "../../utils/scorer";
import Trip from "../../models/Trip";
import { formatPriceWithSymbol } from "../../utils/currency";

@Router(buildRoute("v1/amadeus"))
class AmadeusController {
  @Get("/city-code")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Get city",
      description: "This fetch the cities from amadeus",
    }),
    validateQuery({
      rules: [
        {
          field: "keyword",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async getCityCode(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const keyword = req.query.keyword as string;

    if (!keyword) {
      return sendError(res, "Keyword is required", HttpStatus.BAD_REQUEST);
    }
    try {
      const response = await amadeus.referenceData.locations.get({
        keyword,
        subType: "CITY,AIRPORT", // search both cities and airports
      });

      const data = response.data.map((item: any) => ({
        name: item.name,
        iataCode: item.iataCode,
      }));

      return sendResponse(
        res,
        data,
        "Fetched all cities successfully",
        HttpStatus.OK
      );
    } catch (err: any) {
      return sendError(res, err, HttpStatus.BAD_REQUEST);
    }
  }

  @Get("/search")
  @Use(
     authMiddleware,
    endpointMetadata({
      summary: "Get trip offers",
      description: "Get recommended trip offers info",
    }),
    validateQuery({
      rules: [
        {
          field: "originCityCode",
          required: true,
          type: "string",
        },
        {
          field: "destinationCityCode",
          required: true,
          type: "string",
        },
        {
          field: "startDate",
          required: true,
          type: "string",
        },
        {
          field: "endDate",
          required: true,
          type: "string",
        },
        {
          field: "budget",
          required: true,
          type: "string",
        },
        {
          field: "tripId",
          required: false,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async search(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const {
      originCityCode,
      destinationCityCode,
      startDate,
      endDate,
      budget = "1000",
      tripId,
    } = req.query;

    if (
      !originCityCode ||
      !destinationCityCode ||
      !startDate ||
      !endDate ||
      !budget
    ) {
      return sendError(res, "Keyword are required", HttpStatus.BAD_REQUEST);
    }
    try {
      const flightsResp = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: originCityCode,
        destinationLocationCode: destinationCityCode,
        departureDate: startDate,
        returnDate: endDate,
        adults: "1",
        max: 12,
        currencyCode: "USD",
      });
      const flights = flightsResp.data || [];

      // Get list of hotels in the city first
      const hotelsListResp = await amadeus.referenceData.locations.hotels.byCity
        .get({
          cityCode: destinationCityCode,
        })
        .catch(() => ({ data: [] }));

    
      const hotels = hotelsListResp.data || [];

      const best = findBestPackage(flights, hotels, Number(budget));

      // Extract currency from flight data
      const currency = flights[0]?.price?.currency || "USD";

      const getFlightPrice = (flight: any) => {
        if (typeof flight.price === "object") {
          return flight.price?.total || "N/A";
        }
        return flight.price || "N/A";
      };

      const getHotelPrice = (hotel: any) => {
        return hotel.offers?.[0]?.price?.total || hotel.price || "N/A";
      };

      const tip = best
        ? `Recommended: flight ${formatPriceWithSymbol(getFlightPrice(best.flight), currency)} + hotel ${formatPriceWithSymbol(getHotelPrice(best.hotel), currency)}`
        : `No package fits budget ${formatPriceWithSymbol(Number(budget), currency)}`;

      if (tripId) {
        await Trip.findByIdAndUpdate(tripId, {
          $set: {
            flightOptions: flights.slice(0, 6),
            hotelOptions: hotels.slice(0, 6),
          },
        });
      }

      const data = {
        tip,
        recommended: best ? {
          ...best,
          currency,
          flightPrice: getFlightPrice(best.flight),
          hotelPrice: getHotelPrice(best.hotel),
        } : null,
        flights: flights.slice(0, 6),
        hotels: hotels.slice(0, 6),
        currency,
      };

      return sendResponse(
        res,
        data,
        "Fetched recommended offers successfully",
        HttpStatus.OK
      );
    } catch (err: any) {
      return sendError(res, err, HttpStatus.BAD_REQUEST);
    }
  }
}

export { AmadeusController };
