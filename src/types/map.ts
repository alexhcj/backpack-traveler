/**
 * Type definitions for map components
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Marker extends Coordinates {
  destination: string;
  description: string;
  slug: string;
  image: {
    url: string;
    alt: string;
  };
}

export interface GeoJSONPoint {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    destination: string;
    description: string;
    slug: string;
    image: {
      url: string;
      alt: string;
    };
    [key: string]: any;
  };
}
