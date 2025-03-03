export enum ECategory {
  CAMPING = "CAMPING",
  BEACHES = "BEACHES",
  DOG_FRIENDLY = "DOG_FRIENDLY",
  RESTAURANTS = "RESTAURANTS",
  OVERNIGHT = "OVERNIGHT",
  LOW_BUDGET = "LOW_BUDGET",
  EXPLORE = "EXPLORE",
  DRINKS = "DRINKS",
  FLIGHTS = "FLIGHTS",
  SHOPPING = "SHOPPING",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  VACATION = "VACATION",
  ADVENTURE = "ADVENTURE", // Hiking, trekking, extreme sports, and outdoor adventures
  CULTURAL = "CULTURAL", // Historical sites, museums, and local traditions
  ECO = "ECO", // Sustainable travel to natural destinations, conservation efforts
  LUXURY = "LUXURY", // High-end resorts, private tours, and exclusive experiences
  FOOD = "FOOD", // Local cuisine, food tours, cooking classes
  WELLNESS_AND_SPA = "WELLNESS_AND_SPA", // Yoga retreats, meditation, spa experiences
  ROAD_TRIPS = "ROAD_TRIPS", // Self-driven journeys, scenic routes, campervan travel
  WILDLIFE_AND_SAFARI = "WILDLIFE_AND_SAFARI", // National parks, safaris, animal conservation trips
  URBAN_AND_CITY = "URBAN_AND_CITY", // Exploring major cities, nightlife, cultural landmarks
  RELIGIOUS_AND_SPIRITUAL = "RELIGIOUS_AND_SPIRITUAL", // Pilgrimages, sacred sites, meditation retreats
  SPORTS = "SPORTS", // Skiing, diving, surfing, golf, marathon tourism
  FESTIVAL_AND_EVENT = "FESTIVAL_AND_EVENT", // Attending major festivals, concerts, and cultural events
  TRAIN_AND_SCENIC_RAILWAY = "TRAIN_AND_SCENIC_RAILWAY", // Luxury trains, cross-country rail trips
}

export interface ICategory {
  category: ECategory;
}

export type TCategoriesMap = {
  [key in ECategory]?: string;
};
