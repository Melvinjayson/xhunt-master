/** Proximity intelligence utilities for XHunt mission discovery. */

export interface Coords { lat: number; lng: number; }
export interface GeoPlace { city: string; country: string; countryCode: string; }

/** Haversine great-circle distance between two lat/lng points, in km. */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * (Math.PI / 180)) *
    Math.cos(b.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Human-readable distance string. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Color for the proximity badge based on distance. */
export function proximityColor(km: number): string {
  if (km <= 5)  return '#22FFAA'; // accent — very close
  if (km <= 20) return '#FFB84D'; // warning — moderate
  return '#8B9CC0';               // faint — far
}

/** localStorage key + TTL (1 hour) for cached reverse-geocode results. */
const GEO_CACHE_KEY = 'xhunt-geo-cache';
const GEO_CACHE_TTL = 60 * 60 * 1000;

interface GeoCache {
  coords: Coords;
  place: GeoPlace;
  savedAt: number;
}

function loadGeoCache(): GeoCache | null {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const cache: GeoCache = JSON.parse(raw);
    if (Date.now() - cache.savedAt > GEO_CACHE_TTL) return null;
    return cache;
  } catch { return null; }
}

function saveGeoCache(coords: Coords, place: GeoPlace) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ coords, place, savedAt: Date.now() }));
  } catch { /* ignore quota */ }
}

/**
 * Reverse-geocode coordinates to a human-readable city/country using
 * OpenStreetMap Nominatim (free, no API key required).
 */
export async function reverseGeocode(coords: Coords): Promise<GeoPlace> {
  const cached = loadGeoCache();
  if (cached && haversineKm(cached.coords, coords) < 5) return cached.place;

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'XHunt/1.0 (xhunt.app)' } }
  );
  if (!res.ok) throw new Error('Reverse geocode failed');
  const data = await res.json();

  const place: GeoPlace = {
    city:        data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? 'Unknown',
    country:     data.address?.country ?? '',
    countryCode: (data.address?.country_code ?? '').toUpperCase(),
  };
  saveGeoCache(coords, place);
  return place;
}

/**
 * Forward-geocode a city name to coordinates using Nominatim.
 * Returns null if the query resolves to nothing.
 */
export async function geocodeCity(query: string): Promise<(Coords & GeoPlace) | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'XHunt/1.0 (xhunt.app)' } }
  );
  if (!res.ok) return null;
  const [first] = await res.json();
  if (!first) return null;
  return {
    lat:         parseFloat(first.lat),
    lng:         parseFloat(first.lon),
    city:        first.display_name?.split(',')[0]?.trim() ?? query,
    country:     first.display_name?.split(',').at(-1)?.trim() ?? '',
    countryCode: '',
  };
}

/** Sort a list of missions by distance from user coords (ascending). */
export function sortByProximity<T extends { lat?: number | null; lng?: number | null }>(
  items: T[],
  user: Coords
): (T & { distanceKm: number | null })[] {
  return items
    .map(item => ({
      ...item,
      distanceKm:
        item.lat != null && item.lng != null
          ? haversineKm(user, { lat: item.lat, lng: item.lng })
          : null,
    }))
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

/** Filter items to those within radiusKm of the user (items without coords pass through). */
export function filterByRadius<T extends { lat?: number | null; lng?: number | null; locationType?: string }>(
  items: T[],
  user: Coords,
  radiusKm: number
): T[] {
  return items.filter(item => {
    if (item.locationType === 'remote') return false;
    if (item.lat == null || item.lng == null) return true; // no coords → include
    return haversineKm(user, { lat: item.lat, lng: item.lng }) <= radiusKm;
  });
}

/** Proximity score boost for recommendations: closer = higher boost (0–30). */
export function proximityBoost(missionCoords: Coords | null, userCoords: Coords | null): number {
  if (!missionCoords || !userCoords) return 0;
  const km = haversineKm(userCoords, missionCoords);
  if (km <= 2)  return 30;
  if (km <= 5)  return 25;
  if (km <= 10) return 18;
  if (km <= 20) return 12;
  if (km <= 50) return 6;
  return 0;
}
