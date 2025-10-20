import Amadeus from "amadeus";
import { ENV } from "./env";

export const amadeus = new Amadeus({
  hostname: ENV.AMADEUS_MODE,
  clientId:
    ENV.AMADEUS_MODE === "production" ? ENV.AMADEUS_PROD_KEY : ENV.AMADEUS_KEY,
  clientSecret:
    ENV.AMADEUS_MODE === "production"
      ? ENV.AMADEUS_PROD_SECRET
      : ENV.AMADEUS_SECRET,
});
