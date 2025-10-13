import Amadeus from "amadeus";
import { ENV } from "./env";

export const amadeus = new Amadeus({
  clientId: ENV.AMADEUS_KEY,
  clientSecret: ENV.AMADEUS_SECRET,
});
