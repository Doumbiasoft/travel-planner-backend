import { Request, Response } from "express";
import { sendError } from "../../utils/apiResponseFormat";
import { Router, Get, Use, Req, Res } from "@reflet/express";
import { HttpStatus } from "../../types/httpStatus";
import { logRequest } from "../../middlewares/logging.middleware";
import { endpointMetadata } from "../../middlewares/endpointMetadata.middleware";
import { buildRoute } from "../../config/apiPrefix";
import authMiddleware from "../../middlewares/auth.middleware";
import { findTripByIdAndUserId } from "../../services/trip.service";
import PDFDocument from "pdfkit";

@Router(buildRoute("v1/pdf"))
class PdfController {
  @Get("/export/:tripId")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Export a trip",
      description: "Get all trips for user",
    }),
    logRequest()
  )
  async exportTrip(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const tripId = req.params.tripId;
    if (!tripId) {
      return sendError(res, "TripId param missing", HttpStatus.BAD_REQUEST);
    }
    const trip = await findTripByIdAndUserId(tripId, req.user?._id);
    if (!trip) {
      return sendError(res, "Trip not found", HttpStatus.NOT_FOUND);
    }
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${trip.tripName}.pdf`
    );
    doc.pipe(res);

    doc.fontSize(18).text(trip.tripName, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Destination: ${trip.destination}`);
    doc.text(
      `Dates: ${trip.startDate?.toDateString()} - ${trip.endDate?.toDateString()}`
    );
    doc.text(`Budget: $${trip.budget}`);

    doc.moveDown();
    trip.days.forEach((d, idx) => {
      doc.fontSize(14).text(`Day ${idx + 1}: ${d.date?.toDateString() || ""}`);
      d.events.forEach((ev) => {
        doc
          .fontSize(12)
          .text(
            `- ${ev.kind}: ${ev.title} (${ev.cost ? "$" + ev.cost : "Free"})`
          );
      });
      doc.moveDown();
    });

    if (trip.markers?.length) {
      doc.addPage();
      doc.fontSize(16).text("Map markers");
      trip.markers.forEach((m) =>
        doc.fontSize(12).text(`${m.label || "-"}: ${m.lat}, ${m.lng}`)
      );
    }

    return doc.end();
  }
}

export { PdfController };
