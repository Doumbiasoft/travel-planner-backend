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
} from "../../middlewares/validation.middleware";
import { logRequest } from "../../middlewares/logging.middleware";
import { endpointMetadata } from "../../middlewares/endpointMetadata.middleware";
import { buildRoute } from "../../config/apiPrefix";
import authMiddleware from "../../middlewares/auth.middleware";
import {
  createTrip,
  deleteTripByIdAndUserId,
  findAllTripsByUserId,
  findAllMarkersByTripIdAndUserId,
  findTripByIdAndUserId,
  updateTripByIdAndUserId,
  createAMarker,
} from "../../services/trip.service";

@Router(buildRoute("v1/trips"))
class TripController {
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
    const trips = await findAllTripsByUserId(req.user._id);
    return sendResponse(
      res,
      trips,
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
    const trip = await findTripByIdAndUserId(req.params.id, req.user._id);
    return sendResponse(
      res,
      trip,
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
          field: "origin",
          required: true,
          type: "string",
        },
        {
          field: "originCityCode",
          required: true,
          type: "string",
        },
        {
          field: "destination",
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
          type: "number",
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
    const {
      tripName,
      origin,
      originCityCode,
      destination,
      destinationCityCode,
      startDate,
      endDate,
      budget,
    } = req.body;

    try {
      if (
        !tripName ||
        !origin ||
        !originCityCode ||
        !destination ||
        !destinationCityCode ||
        !startDate ||
        !endDate ||
        !budget
      )
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      const data = { ...req.body, userId: req.user._id };

      await createTrip(data);

      return sendResponse(
        res,
        { ok: true },
        "Added a trip successfully",
        HttpStatus.CREATED
      );
    } catch (err: any) {
      console.log(err);
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch("/:id")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Update a trip",
      description: "Update a trip for a user",
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
    validateBody({
      rules: [
        {
          field: "tripId",
          required: true,
          type: "string",
        },
        {
          field: "tripName",
          required: false,
          type: "string",
        },
        {
          field: "origin",
          required: false,
          type: "string",
        },
        {
          field: "originCityCode",
          required: false,
          type: "string",
        },
        {
          field: "destination",
          required: false,
          type: "string",
        },
        {
          field: "destinationCityCode",
          required: false,
          type: "string",
        },
        {
          field: "startDate",
          required: false,
          type: "string",
        },
        {
          field: "endDate",
          required: false,
          type: "string",
        },
        {
          field: "budget",
          required: true,
          type: "number",
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
  async updateATrip(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const {
      tripId,
      tripName,
      origin,
      originCityCode,
      destination,
      destinationCityCode,
      startDate,
      endDate,
      budget,
    } = req.body;

    try {
      if (
        !tripId ||
        !tripName ||
        !origin ||
        !originCityCode ||
        !destination ||
        !destinationCityCode ||
        !startDate ||
        !endDate ||
        !budget
      )
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      if (tripId !== req.params.id)
        return sendError(res, "Resource not found", HttpStatus.NOT_FOUND);
      const data = { ...req.body };
      delete data.tripId;

      await updateTripByIdAndUserId(tripId, req.user._id, data);

      return sendResponse(
        res,
        { ok: true },
        "Updated a trip successfully",
        HttpStatus.OK
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete("/:id")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Delete a trip",
      description: "Delete a trip for a user",
    }),
    logRequest()
  )
  async deleteATrip(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const tripId = req.params.id;

    try {
      if (!tripId)
        return sendError(res, "Param id field missing", HttpStatus.BAD_REQUEST);

      await deleteTripByIdAndUserId(tripId, req.user._id);

      return sendResponse(
        res,
        { ok: true },
        "Updated a trip successfully",
        HttpStatus.OK
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }
  @Get("/:tripId/markers")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Get all markers",
      description: "Get all markers for a trip",
    }),
    logRequest()
  )
  async tripMarkers(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const tripId = req.params.tripId;
    const markers = await findAllMarkersByTripIdAndUserId(tripId, req.user._id);
    return sendResponse(
      res,
      { markers: markers },
      "Fetched all trips for a user successfully",
      HttpStatus.OK
    );
  }

  @Post("/:tripId/markers/add")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Add a marker",
      description: "Add a marker for a trip",
    }),
    validateBody({
      rules: [
        {
          field: "lat",
          required: true,
          type: "number",
        },
        {
          field: "lng",
          required: true,
          type: "number",
        },
        {
          field: "label",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async addAMarker(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const tripId = req.params.tripId;
    if (!tripId)
      return sendError(res, "Missing tripId param", HttpStatus.BAD_REQUEST);
    const { lat, lng, label } = req.body;

    try {
      if (!lat || !lng || !label)
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      await createAMarker(tripId, req.user._id, req.body);

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

export { TripController };
