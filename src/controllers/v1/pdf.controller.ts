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
import { validateParams } from "../../middlewares/validation.middleware";
import { findBestPackage } from "../../utils/scorer";

@Router(buildRoute("v1/pdf"))
class PdfController {
  @Get("/export/:tripId")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Export a trip",
      description: "Get all trips for user",
    }),
    validateParams({
      rules: [
        {
          field: "tripId",
          required: true,
          type: "string",
        },
      ],
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

    // Title
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(trip.tripName, { underline: true });
    doc.moveDown(1.5);

    // Trip Information
    doc.fontSize(14).font("Helvetica-Bold").text("Trip Information");
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica");
    doc
      .text(`Destination: `, { continued: true })
      .font("Helvetica-Bold")
      .text(trip.destination.toString());
    doc
      .font("Helvetica")
      .text(`Dates: `, { continued: true })
      .font("Helvetica-Bold")
      .text(
        `${trip.startDate?.toDateString()} - ${trip.endDate?.toDateString()}`
      );
    doc
      .font("Helvetica")
      .text(`Budget: `, { continued: true })
      .font("Helvetica-Bold")
      .text(`$${trip.budget.toLocaleString()}`);

    doc.moveDown(1.5);

    // Recommended flight and hotel if available
    if (trip.flightOptions?.length || trip.hotelOptions?.length) {
      const bestPackage = findBestPackage(
        (trip.flightOptions as any[]) || [],
        (trip.hotelOptions as any[]) || [],
        trip.budget
      );

      if (bestPackage) {
        // Section header
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Recommended Travel Package", { underline: true });
        doc.moveDown(1);

        // Flight details
        if (bestPackage.flight) {
          const flight = bestPackage.flight as any;
          const flightPrice =
            typeof flight.price === "object"
              ? flight.price?.total
              : flight.price || 0;

          doc.fontSize(14).font("Helvetica-Bold").text("Flight Details");
          doc.moveDown(0.5);
          doc.fontSize(12).font("Helvetica");

          // Outbound flight
          if (flight.itineraries?.[0]) {
            const outbound = flight.itineraries[0];
            const segments = outbound.segments || [];
            const firstSegment = segments[0];
            const lastSegment = segments[segments.length - 1];

            if (firstSegment && lastSegment) {
              doc
                .font("Helvetica-Bold")
                .text("Outbound Flight:", { continued: true })
                .font("Helvetica")
                .text(
                  ` ${firstSegment.departure.iataCode} → ${lastSegment.arrival.iataCode}`
                );
              doc.text(
                `   Departure: ${new Date(
                  firstSegment.departure.at
                ).toLocaleString()}`
              );
              doc.text(
                `   Arrival: ${new Date(
                  lastSegment.arrival.at
                ).toLocaleString()}`
              );
              doc.text(`   Stops: ${segments.length - 1}`);
              doc.moveDown(0.3);
            }
          }

          // Return flight
          if (flight.itineraries?.[1]) {
            const returnFlight = flight.itineraries[1];
            const segments = returnFlight.segments || [];
            const firstSegment = segments[0];
            const lastSegment = segments[segments.length - 1];

            if (firstSegment && lastSegment) {
              doc
                .font("Helvetica-Bold")
                .text("Return Flight:", { continued: true })
                .font("Helvetica")
                .text(
                  ` ${firstSegment.departure.iataCode} → ${lastSegment.arrival.iataCode}`
                );
              doc.text(
                `   Departure: ${new Date(
                  firstSegment.departure.at
                ).toLocaleString()}`
              );
              doc.text(
                `   Arrival: ${new Date(
                  lastSegment.arrival.at
                ).toLocaleString()}`
              );
              doc.moveDown(0.3);
            }
          }

          doc
            .font("Helvetica-Bold")
            .text("Flight Price:", { continued: true })
            .font("Helvetica")
            .text(` $${Number(flightPrice).toFixed(2)}`);
          doc.moveDown(1);
        }

        // Hotel details
        if (bestPackage.hotel) {
          const hotel = bestPackage.hotel as any;
          const hotelPrice =
            hotel.offers?.[0]?.price?.total || hotel.price || 0;

          doc.fontSize(14).font("Helvetica-Bold").text("Hotel Details");
          doc.moveDown(0.5);
          doc.fontSize(12).font("Helvetica");

          doc
            .font("Helvetica-Bold")
            .text("Name:", { continued: true })
            .font("Helvetica")
            .text(` ${hotel.name || "N/A"}`);

          if (hotel.address) {
            const addressLines = hotel.address.lines?.join(", ") || "";
            const city = hotel.address.cityName || "";
            const fullAddress = [addressLines, city].filter(Boolean).join(", ");
            if (fullAddress) {
              doc
                .font("Helvetica-Bold")
                .text("Address:", { continued: true })
                .font("Helvetica")
                .text(` ${fullAddress}`);
            }
          }

          if (hotelPrice > 0) {
            doc
              .font("Helvetica-Bold")
              .text("Hotel Price:", { continued: true })
              .font("Helvetica")
              .text(` $${Number(hotelPrice).toFixed(2)}`);
          }

          if (hotel.geoCode) {
            doc
              .font("Helvetica-Bold")
              .text("Location:", { continued: true })
              .font("Helvetica")
              .text(` ${hotel.geoCode.latitude}, ${hotel.geoCode.longitude}`);
          }

          doc.moveDown(1);
        }

        // Package summary
        doc.fontSize(14).font("Helvetica-Bold").text("Package Summary");
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc
          .font("Helvetica-Bold")
          .text("Total Price:", { continued: true })
          .font("Helvetica")
          .text(` $${bestPackage.combinedPrice.toFixed(2)}`);

        const budgetStatus = bestPackage.fitsBudget ? "Yes ✓" : "No ✗";
        const budgetColor = bestPackage.fitsBudget ? "green" : "red";
        doc
          .font("Helvetica-Bold")
          .text("Within Budget:", { continued: true })
          .font("Helvetica")
          .text(` ${budgetStatus}`);

        doc.moveDown(1.5);
      }
    }

    // Itinerary section
    if (trip.days?.length) {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Daily Itinerary", { underline: true });
      doc.moveDown(1);

      trip.days.forEach((d, idx) => {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(`Day ${idx + 1}: ${d.date?.toDateString() || ""}`);
        doc.moveDown(0.3);

        if (d.events?.length) {
          d.events.forEach((ev) => {
            doc.fontSize(12).font("Helvetica");
            const costText = ev.cost ? `$${ev.cost}` : "Free";
            doc
              .text(`   • `, { continued: true })
              .font("Helvetica-Bold")
              .text(`${ev.kind}: `, { continued: true })
              .font("Helvetica")
              .text(`${ev.title} (${costText})`);
          });
        } else {
          doc
            .fontSize(12)
            .font("Helvetica-Oblique")
            .text("   No events planned");
        }

        doc.moveDown(0.8);
      });
    }

    // Map markers section
    if (trip.markers?.length) {
      doc.addPage();
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Map Markers", { underline: true });
      doc.moveDown(1);

      trip.markers.forEach((m) => {
        doc.fontSize(12).font("Helvetica");
        doc
          .font("Helvetica-Bold")
          .text(`${m.label || "Unnamed"}:`, { continued: true })
          .font("Helvetica")
          .text(` ${m.lat}, ${m.lng}`);
      });
    }

    return doc.end();
  }
}

export { PdfController };
