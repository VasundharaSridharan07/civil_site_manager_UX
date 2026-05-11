// @ts-nocheck
/**
 * Fetches published CRS from TGR data (crs-tgr.json exported from tgr.db).
 * Used when published CRS source is set to 'TGR'.
 */

import type { CRSItem } from '../types';
import type { FetchPublishedCRSOptions } from './crsApi';

const TGR_JSON_URL = '/crs-tgr.json';

let cachedList: CRSItem[] | null = null;

function formatExtents(
  south: number | null,
  north: number | null,
  west: number | null,
  east: number | null
): string {
  if (
    south != null &&
    north != null &&
    west != null &&
    east != null
  ) {
    return `${south}, ${north}, ${west}, ${east}`;
  }
  return '-';
}

function distanceSq(
  lat: number,
  lng: number,
  refLat: number,
  refLng: number
): number {
  const dLat = lat - refLat;
  const dLng = lng - refLng;
  return dLat * dLat + dLng * dLng;
}

export async function fetchPublishedCRSFromTgr(
  options?: FetchPublishedCRSOptions
): Promise<CRSItem[]> {
  if (cachedList === null) {
    const res = await fetch(TGR_JSON_URL);
    if (!res.ok) {
      throw new Error(`TGR CRS data not available: ${res.status} ${res.statusText}. Run: node scripts/export-tgr-crs.mjs`);
    }
    const raw = await res.json();
    cachedList = Array.isArray(raw) ? raw : raw?.items ?? raw?.results ?? [];
  }

  let list = cachedList;

  const epsgCode =
    options?.epsgCodeMatch != null && String(options.epsgCodeMatch).trim() !== ''
      ? String(options.epsgCodeMatch).trim().replace(/^EPSG:?/i, '')
      : undefined;

  if (epsgCode != null) {
    list = list.filter((item) => {
      const c = String(item.code ?? '').replace(/^EPSG:?/i, '').trim();
      return c === epsgCode;
    });
  } else if (options?.textMatch != null && options.textMatch.trim() !== '') {
    const q = options.textMatch.trim().toLowerCase();
    list = list.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.horizontalComponent && item.horizontalComponent.toLowerCase().includes(q))
    );
  }

  const proximityLat = options?.proximityLatitude;
  const proximityLng = options?.proximityLongitude;
  if (proximityLat != null && proximityLng != null && list.length > 0) {
    list = list.filter((item) => {
      const bbox = parseBbox(item.latLong ?? item.area ?? '');
      if (!bbox) return true;
      return pointInBbox(proximityLat, proximityLng, bbox);
    });
    list = [...list].sort((a, b) => {
      const aLat = parseLatLonFromArea(a.latLong);
      const bLat = parseLatLonFromArea(b.latLong);
      const aDist = aLat ? distanceSq(aLat.lat, aLat.lng, proximityLat, proximityLng) : 1e30;
      const bDist = bLat ? distanceSq(bLat.lat, bLat.lng, proximityLat, proximityLng) : 1e30;
      return aDist - bDist;
    });
  }

  return list;
}

/** Parsed bbox: south, north, west, east (latLong format in export is "south, north, west, east"). */
function parseBbox(area: string): { south: number; north: number; west: number; east: number } | null {
  if (!area || area === '-') return null;
  const parts = area.split(',').map((p) => parseFloat(p.trim()));
  if (parts.length >= 4 && parts.every((n) => !Number.isNaN(n))) {
    return { south: parts[0], north: parts[1], west: parts[2], east: parts[3] };
  }
  return null;
}

/** True if (lat, lng) is inside the bbox. Handles longitude wrap (e.g. west > east). */
function pointInBbox(
  lat: number,
  lng: number,
  bbox: { south: number; north: number; west: number; east: number }
): boolean {
  if (lat < bbox.south || lat > bbox.north) return false;
  const { west, east } = bbox;
  if (west <= east) return lng >= west && lng <= east;
  return lng >= west || lng <= east;
}

function parseLatLonFromArea(area: string): { lat: number; lng: number } | null {
  const bbox = parseBbox(area);
  if (!bbox) return null;
  return {
    lat: (bbox.south + bbox.north) / 2,
    lng: (bbox.west + bbox.east) / 2,
  };
}

/** Clear in-memory cache (e.g. after source switch or when JSON is updated). */
export function clearTgrCrsCache(): void {
  cachedList = null;
}
