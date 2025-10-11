// Type definitions
interface FlightSegment {
  departure: { at: string };
  arrival: { at: string };
}

interface FlightItinerary {
  segments: FlightSegment[];
}

interface Flight {
  price?: { total?: number } | number;
  itineraries?: FlightItinerary[];
}

interface Hotel {
  offers?: Array<{ price?: { total?: number } }>;
  price?: number;
  hotel?: { rating?: number };
  rating?: number;
}

interface FlightScore {
  score: number;
  price: number;
  durationMin: number;
  stops: number;
}

interface HotelScore {
  score: number;
  price: number;
  rating: number;
}

interface ScoredFlight extends FlightScore {
  f: Flight;
}

interface ScoredHotel extends HotelScore {
  h: Hotel;
}

interface PackageCombo {
  flight: Flight;
  hotel: Hotel;
  combinedPrice: number;
  combinedScore: number;
  fitsBudget: boolean;
  flightScore: number;
  hotelScore: number;
}

const getFlightDurationMinutes = (flight: Flight): number => {
  try {
    const segs = flight.itineraries![0].segments;
    const dep = new Date(segs[0].departure.at);
    const arr = new Date(segs[segs.length - 1].arrival.at);
    return (arr.getTime() - dep.getTime()) / (1000 * 60);
  } catch (e) {
    return 24 * 60;
  }
};

export const scoreFlight = (flight: Flight, budget: number = 1000): FlightScore => {
  const price = Number(
    typeof flight.price === 'object' ? flight.price?.total : flight.price || 1_000_000
  );
  const priceScore = Math.max(0, 1 - price / (budget || price + 1));
  const durationMin = getFlightDurationMinutes(flight);
  const durationScore = Math.max(0, 1 - durationMin / (24 * 60));
  const stops = (flight.itineraries?.[0]?.segments?.length || 1) - 1;
  const stopsScore = Math.max(0, 1 - stops / 5);
  const score = priceScore * 0.55 + durationScore * 0.25 + stopsScore * 0.2;
  return { score, price, durationMin, stops };
};

export const scoreHotel = (hotel: Hotel, budget: number = 1000): HotelScore => {
  const price = Number(
    hotel?.offers?.[0]?.price?.total || hotel.price || 1_000_000
  );
  const priceScore = Math.max(0, 1 - price / (budget || price + 1));
  const rating = Number(hotel?.hotel?.rating || hotel.rating || 0);
  const ratingScore = Math.max(0, Math.min(1, rating / 5));
  const score = priceScore * 0.6 + ratingScore * 0.4;
  return { score, price, rating };
};

export const findBestPackage = (
  flights: Flight[],
  hotels: Hotel[],
  budget: number = 1000
): PackageCombo | null => {
  const scoredFlights: ScoredFlight[] = flights
    .map((f) => ({ f, ...scoreFlight(f, budget) }))
    .sort((a, b) => b.score - a.score);
  const scoredHotels: ScoredHotel[] = hotels
    .map((h) => ({ h, ...scoreHotel(h, budget) }))
    .sort((a, b) => b.score - a.score);
  const combos: PackageCombo[] = [];
  const topF = scoredFlights.slice(0, 5);
  const topH = scoredHotels.slice(0, 5);
  for (const ff of topF) {
    for (const hh of topH) {
      const combinedPrice = (ff.price || 0) + (hh.price || 0);
      const fitsBudget = combinedPrice <= budget;
      const combinedScore = ff.score * 0.6 + hh.score * 0.4;
      combos.push({
        flight: ff.f,
        hotel: hh.h,
        combinedPrice,
        combinedScore,
        fitsBudget,
        flightScore: ff.score,
        hotelScore: hh.score,
      });
    }
  }
  const fit = combos.filter((c) => c.fitsBudget);
  const sorted = (fit.length ? fit : combos).sort(
    (a, b) => b.combinedScore - a.combinedScore
  );
  return sorted[0] || null;
};
