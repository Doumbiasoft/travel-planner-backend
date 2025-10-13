declare module "amadeus" {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: string;
    ssl?: boolean;
    port?: number;
    customAppId?: string;
    customAppVersion?: string;
    http?: any;
  }

  class Amadeus {
    constructor(config: AmadeusConfig);
    shopping: {
      flightOffersSearch: {
        get(params: any): Promise<any>;
      };
      hotelOffersSearch: {
        get(params: any): Promise<any>;
      };
      activities: {
        get(params: any): Promise<any>;
      };
      hotelOffers: any;
    };
    referenceData: {
      locations: {
        get(params: any): Promise<any>;
        hotels: {
          byCity: {
            get(params: any): Promise<any>;
          };
        };
      };
    };
  }

  export = Amadeus;
}
