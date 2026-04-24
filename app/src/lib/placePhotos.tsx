/**
 * Helpers for Google Places photo media URLs.
 */

import type {
  ItineraryDay,
  ItineraryItem,
  PlacePhoto,
  PlaceRecommendation,
} from "@/lib/smartourApi";

const PLACES_API_BASE_URL = "https://places.googleapis.com/v1";
const STREET_VIEW_STATIC_BASE_URL =
  "https://maps.googleapis.com/maps/api/streetview";
const DEFAULT_PHOTO_WIDTH_PX = 900;
const DEFAULT_GALLERY_TILE_COUNT = 5;
const DEFAULT_STREET_VIEW_SIZE = "900x540";

/**
 * A place selected for the daily photo gallery.
 */
export type GalleryPlace = {
  id: string;
  item: ItineraryItem;
  photoUrl: string | null;
};

/**
 * Build a Google Places Photo Media URL.
 *
 * @param photoName - The Google Places photo resource name.
 * @param apiKey - The Google Maps Platform API key.
 * @param maxWidthPx - The requested maximum photo width.
 * @returns The photo media URL.
 */
export function buildPlacePhotoUrl(
  photoName: string,
  apiKey: string,
  maxWidthPx: number = DEFAULT_PHOTO_WIDTH_PX,
): string {
  const url = new URL(`${PLACES_API_BASE_URL}/${photoName}/media`);
  url.searchParams.set("maxWidthPx", `${maxWidthPx}`);
  url.searchParams.set("key", apiKey);
  return url.toString();
}

/**
 * Select places and photo URLs for one itinerary day.
 *
 * @param day - The active itinerary day.
 * @param apiKey - The Google Maps Platform API key.
 * @param minimumTileCount - The minimum number of visual tiles to return.
 * @returns Gallery places for the day.
 */
export function buildGalleryPlaces(
  day: ItineraryDay | null,
  apiKey: string,
  minimumTileCount: number = DEFAULT_GALLERY_TILE_COUNT,
): GalleryPlace[] {
  if (day === null) {
    return [];
  }
  const primaryEntries = day.items.map((item) =>
    buildGalleryPlace(item, item.place.photos[0] ?? null, apiKey, 0),
  );
  const extraEntries = day.items.flatMap((item) =>
    item.place.photos
      .slice(1)
      .map((photo, index) => buildGalleryPlace(item, photo, apiKey, index + 1)),
  );
  const entries = [...primaryEntries, ...extraEntries];
  const photoEntries = entries.filter((entry) => entry.photoUrl !== null);
  return fillGalleryPlaces(
    photoEntries.length > 0 ? photoEntries : entries,
    minimumTileCount,
  ).slice(0, minimumTileCount);
}

/**
 * Build one gallery entry for a place photo.
 *
 * @param item - The itinerary item shown in the gallery.
 * @param photo - The Google Places photo resource.
 * @param apiKey - The Google Maps Platform API key.
 * @param photoIndex - The photo index for the item.
 * @returns A gallery entry.
 */
function buildGalleryPlace(
  item: ItineraryItem,
  photo: PlacePhoto | null,
  apiKey: string,
  photoIndex: number,
): GalleryPlace {
  return {
    id: `${item.place.place_id}-${item.time}-photo-${photoIndex}`,
    item,
    photoUrl: !apiKey
      ? null
      : photo === null
        ? buildFallbackPlacePhotoUrl(item.place, apiKey)
        : buildPlacePhotoUrl(photo.name, apiKey),
  };
}

/**
 * Build a fallback image URL for places without Places photo resources.
 *
 * @param place - The place recommendation needing a fallback image.
 * @param apiKey - The Google Maps Platform API key.
 * @returns A Street View Static URL when the place has a usable location.
 */
function buildFallbackPlacePhotoUrl(
  place: PlaceRecommendation,
  apiKey: string,
): string | null {
  if (!apiKey || place.location === null) {
    return null;
  }
  const url = new URL(STREET_VIEW_STATIC_BASE_URL);
  url.searchParams.set("size", DEFAULT_STREET_VIEW_SIZE);
  url.searchParams.set(
    "location",
    `${place.location.latitude},${place.location.longitude}`,
  );
  url.searchParams.set("source", "outdoor");
  url.searchParams.set("key", apiKey);
  return url.toString();
}

/**
 * Repeat gallery entries until the required visual tile count is reached.
 *
 * @param entries - The source gallery entries.
 * @param minimumTileCount - The minimum number of visual tiles.
 * @returns Gallery entries with repeated items when needed.
 */
function fillGalleryPlaces(
  entries: GalleryPlace[],
  minimumTileCount: number,
): GalleryPlace[] {
  if (entries.length === 0) {
    return [];
  }
  const filledEntries = [...entries];
  let currentIndex = 0;
  while (filledEntries.length < minimumTileCount) {
    const sourceEntry = entries[currentIndex % entries.length];
    filledEntries.push({
      ...sourceEntry,
      id: `${sourceEntry.id}-repeat-${currentIndex}`,
    });
    currentIndex += 1;
  }
  return filledEntries;
}
