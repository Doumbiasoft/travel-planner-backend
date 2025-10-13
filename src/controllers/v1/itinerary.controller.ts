import { Request, Response } from "express";
import { sendResponse, sendError } from "../../utils/apiResponseFormat";
import {
  Router,
  Get,
  Post,
  Delete,
  Patch,
  Use,
  Req,
  Res,
} from "@reflet/express";
import { HttpStatus } from "../../types/httpStatus";
import {
  validateBody,
  validateParams,
  ValidationPatterns,
} from "../../middlewares/validation.middleware";
import { logRequest } from "../../middlewares/logging.middleware";
import { endpointMetadata } from "../../middlewares/endpointMetadata.middleware";
import { buildRoute } from "../../config/apiPrefix";
import authMiddleware from "../../middlewares/auth.middleware";
import {
  createItinerary,
  findAllItinerariesByUserId,
  findItineraryByIdAndUserId,
} from "../../services/itinerary.service";

@Router(buildRoute("v1/itineraries"))
class ItineraryController {
  @Get()
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Get all trips",
      description: "Get all trips for user",
    }),
    logRequest()
  )
  async userTrips(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const trips = await findAllItinerariesByUserId(req.user._id);
    return sendResponse(
      res,
      { trips: trips },
      "Fetched all trips for a user successfully",
      HttpStatus.OK
    );
  }

  @Get("/:id")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Get single trip",
      description: "Fetch a trip for a user",
    }),
    validateParams({
      rules: [
        {
          field: "id",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async getTripById(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const id = req.params.itineraryId;
    const trip = await findItineraryByIdAndUserId(id, req.user._id);
    return sendResponse(
      res,
      { trip: trip },
      "Fetched a trip successfully",
      HttpStatus.OK
    );
  }

  @Post("")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Add a trip",
      description: "Add a trip for a user",
    }),
    validateBody({
      rules: [
        {
          field: "tripName",
          required: true,
          type: "string",
        },
        {
          field: "destination",
          required: true,
          type: "string",
        },
        {
          field: "cityCode",
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
          field: "markers",
          required: false,
          type: "array",
        },
      ],
    }),
    logRequest()
  )
  async addATrip(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    try {
      const { tripName, destination, cityCode, startDate, endDate, budget } =
        req.body;
      if (
        !tripName ||
        !destination ||
        !cityCode ||
        !startDate ||
        !endDate ||
        !budget
      )
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      const data = { ...req.body, userId: req.user._id };

      await createItinerary(data);

      return sendResponse(
        res,
        { ok: true },
        "Added a trip successfully",
        HttpStatus.CREATED
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }
}

export { ItineraryController };
