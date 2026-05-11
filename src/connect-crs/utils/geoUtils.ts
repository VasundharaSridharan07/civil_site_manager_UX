import type { CRSItem } from '../types';

export const TILE_SIZE = 256;

export const project = (lat: number, lng: number, zoom: number) => {
  const siny = Math.sin((lat * Math.PI) / 180);
  const sinyClamped = Math.min(Math.max(siny, -0.9999), 0.9999);
  const n = Math.pow(2, zoom);
  
  const x = TILE_SIZE * n * (0.5 + lng / 360);
  const y = TILE_SIZE * n * (0.5 - Math.log((1 + sinyClamped) / (1 - sinyClamped)) / (4 * Math.PI));
  return { x, y };
};

export const unproject = (x: number, y: number, zoom: number) => {
  const n = Math.pow(2, zoom);
  const lng = ((x / (TILE_SIZE * n)) - 0.5) * 360;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / (TILE_SIZE * n))));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
};

export const distSq = (x1: number, y1: number, x2: number, y2: number) => (x1 - x2) ** 2 + (y1 - y2) ** 2;

export const getClosestPointOnSegment = (p: {x:number, y:number}, v: {x:number, y:number}, w: {x:number, y:number}) => {
  const l2 = distSq(v.x, v.y, w.x, w.y);
  if (l2 === 0) return { x: v.x, y: v.y, t: 0 };
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y),
    t
  };
};

// Mock Projection Functions
export const mockGeoToProj = (lat: number, lng: number) => {
  const n = lat * 111320; 
  const e = lng * (40075000 / 360) * Math.cos(lat * Math.PI / 180) + 500000; 
  return { e, n };
};

export const mockProjToGeo = (e: number, n: number) => {
  const lat = n / 111320;
  const lng = (e - 500000) / ((40075000 / 360) * Math.cos(lat * Math.PI / 180));
  return { lat, lng };
};

/**
 * Parse a latitude or longitude value from a string (e.g. "40.5853° N", "-119.34°", "105.0844° W").
 * Returns the signed number in degrees, or NaN if unparseable.
 */
function parseLatLongDegree(value: string): number {
  if (value == null || typeof value !== 'string' || value.trim() === '' || value === '-') return NaN;
  const cleaned = value.replace(/[°\s]/g, '').trim();
  const num = parseFloat(cleaned.replace(/[NSWE]/gi, '').trim());
  if (Number.isNaN(num)) return NaN;
  const upper = cleaned.toUpperCase();
  if (upper.endsWith('S') || upper.endsWith('W')) return -Math.abs(num);
  return num;
}

/**
 * Format latitude for display: use N/S suffix, never show negative (e.g. "40.585300° N", "33.450000° S").
 */
export function formatLatForDisplay(lat: number | string): string {
  const num = typeof lat === 'number' ? lat : parseLatLongDegree(lat);
  if (Number.isNaN(num)) return typeof lat === 'string' ? lat : '';
  const abs = Math.abs(num);
  const suffix = num >= 0 ? 'N' : 'S';
  return `${abs.toFixed(6)}° ${suffix}`;
}

/**
 * Format longitude for display: use E/W suffix, never show negative (e.g. "119.340930° W", "105.084400° E").
 */
export function formatLongForDisplay(lng: number | string): string {
  const num = typeof lng === 'number' ? lng : parseLatLongDegree(lng);
  if (Number.isNaN(num)) return typeof lng === 'string' ? lng : '';
  const abs = Math.abs(num);
  const suffix = num >= 0 ? 'E' : 'W';
  return `${abs.toFixed(6)}° ${suffix}`;
}

// Helper to parse CRS Lat/Long string "40.0°N, 123.0°W"
export const parseCrsLatLong = (str: string): { lat: number, lng: number } | null => {
  if (!str || str === '-' || str === 'Global') return null;
  // Regex for "40.0°N, 123.0°W"
  const match = str.match(/([0-9.]+)°([NS]),\s*([0-9.]+)°([EW])/);
  if (match) {
    let lat = parseFloat(match[1]);
    if (match[2] === 'S') lat = -lat;
    let lng = parseFloat(match[3]);
    if (match[4] === 'W') lng = -lng;
    return { lat, lng };
  }
  return null;
};

// Region check helper
export const isItemInRegion = (item: CRSItem, region: string) => {
  if (!region || region === 'All') return true;
  const area = item.area.toLowerCase();
  const r = region.toLowerCase();
  
  if (r === 'north america') return area.includes('usa') || area.includes('canada') || area.includes('north america') || area.includes('mexico');
  if (r === 'europe') return area.includes('europe') || area.includes('uk') || area.includes('united kingdom') || area.includes('france') || area.includes('germany') || area.includes('italy') || area.includes('spain') || area.includes('norway') || area.includes('sweden') || area.includes('finland') || area.includes('netherlands') || area.includes('poland') || area.includes('ireland');
  if (r === 'asia') return area.includes('asia') || area.includes('japan') || area.includes('china') || area.includes('hong kong') || area.includes('singapore') || area.includes('india');
  if (r === 'australia') return area.includes('australia') || area.includes('new zealand');
  if (r === 'south america') return area.includes('south america') || area.includes('brazil') || area.includes('chile');
  if (r === 'africa') return area.includes('africa') || area.includes('south africa') || area.includes('nigeria');
  
  return area.includes(r);
};
