import proj4 from 'proj4';

// Cache for EPSG definitions fetched from epsg.io
const epsgDefinitionCache = new Map<string, string>();

// Known axis orders for common CRS types
// Most projected CRS use Easting, Northing (E,N)
// Some geographic CRS use Northing, Easting (N,E)
const AXIS_ORDER_EXCEPTIONS = new Set([
  '4326', // WGS 84 - lat, lng
  '4269', // NAD83 - lat, lng
]);

/**
 * Get the EPSG definition string for a given CRS code.
 * Uses proj4's built-in definitions first, falls back to epsg.io API.
 */
async function getEPSGDefinition(crsCode: string): Promise<string | null> {
  // Remove 'EPSG:' prefix if present
  const code = crsCode.replace(/^EPSG:/i, '');
  
  // Check cache first
  if (epsgDefinitionCache.has(code)) {
    return epsgDefinitionCache.get(code)!;
  }

  // Try proj4's built-in definitions first
  try {
    const builtInDef = proj4.defs(`EPSG:${code}`);
    if (builtInDef) {
      const defStr = typeof builtInDef === 'string' ? builtInDef : JSON.stringify(builtInDef);
      epsgDefinitionCache.set(code, defStr);
      return defStr;
    }
  } catch (e) {
    // Not in built-in definitions, continue to fetch
  }

  // Fetch from epsg.io
  try {
    const response = await fetch(`https://epsg.io/${code}.proj4`);
    if (response.ok) {
      const definition = await response.text();
      proj4.defs(`EPSG:${code}`, definition);
      epsgDefinitionCache.set(code, definition);
      return definition;
    }
  } catch (error) {
    console.error(`Failed to fetch EPSG definition for ${code}:`, error);
  }

  return null;
}

/**
 * Determine the axis order for a given CRS code.
 * Returns 'EN' for Easting, Northing or 'NE' for Northing, Easting.
 * Most projected CRS use E,N order.
 */
export function getCRSAxisOrder(crsCode: string): 'EN' | 'NE' {
  const code = crsCode.replace(/^EPSG:/i, '');
  
  // Geographic CRS typically use lat, lng (which maps to N, E in our context)
  if (AXIS_ORDER_EXCEPTIONS.has(code)) {
    return 'NE';
  }
  
  // Default for projected CRS is E, N
  return 'EN';
}

/**
 * Convert geographic coordinates (lat, lng) to projected coordinates (easting, northing).
 * Returns null if transformation fails.
 */
export async function geoToProjected(
  lat: number,
  lng: number,
  crsCode: string
): Promise<{ easting: number; northing: number } | null> {
  try {
    const code = crsCode.replace(/^EPSG:/i, '');
    
    // Ensure CRS definition is loaded
    await getEPSGDefinition(code);
    
    // WGS84 (geographic) to the target CRS
    const wgs84 = 'EPSG:4326';
    const targetCRS = `EPSG:${code}`;
    
    // proj4 expects [lng, lat] as input
    const result = proj4(wgs84, targetCRS, [lng, lat]);
    
    // result is [x, y] which typically corresponds to [easting, northing]
    return {
      easting: result[0],
      northing: result[1]
    };
  } catch (error) {
    console.error(`Failed to transform geo to projected for CRS ${crsCode}:`, error);
    return null;
  }
}

/**
 * Convert projected coordinates (easting, northing) to geographic coordinates (lat, lng).
 * Returns null if transformation fails.
 */
export async function projectedToGeo(
  easting: number,
  northing: number,
  crsCode: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const code = crsCode.replace(/^EPSG:/i, '');
    
    // Ensure CRS definition is loaded
    await getEPSGDefinition(code);
    
    const sourceCRS = `EPSG:${code}`;
    const wgs84 = 'EPSG:4326';
    
    // proj4 expects [x, y] which is [easting, northing]
    const result = proj4(sourceCRS, wgs84, [easting, northing]);
    
    // result is [lng, lat]
    return {
      lat: result[1],
      lng: result[0]
    };
  } catch (error) {
    console.error(`Failed to transform projected to geo for CRS ${crsCode}:`, error);
    return null;
  }
}

/**
 * Format a projected coordinate value with appropriate decimal places and unit.
 * Uses 3 decimal places for meters (millimeter precision) and feet.
 */
export function formatProjectedValue(value: number, unit: string): string {
  const decimals = 3; // millimeter precision for meters, similar for feet
  const formattedValue = value.toFixed(decimals);
  
  // Get unit abbreviation
  let unitAbbrev = 'm';
  const lowerUnit = unit.toLowerCase();
  
  if (lowerUnit.includes('foot') || lowerUnit.includes('feet') || lowerUnit.includes('ft')) {
    unitAbbrev = 'ft';
  } else if (lowerUnit.includes('meter') || lowerUnit.includes('metre')) {
    unitAbbrev = 'm';
  } else if (lowerUnit.includes('kilomet')) {
    unitAbbrev = 'km';
  }
  
  return `${formattedValue} ${unitAbbrev}`;
}

/**
 * Parse a projected coordinate value string, removing unit labels if present.
 */
export function parseProjectedValue(value: string): number | null {
  // Remove common unit abbreviations
  const cleaned = value.replace(/\s*(m|ft|km|meter|metre|foot|feet)\s*$/i, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get a short unit abbreviation from a CRS unit string.
 */
export function getUnitAbbreviation(unit: string): string {
  const lowerUnit = unit.toLowerCase();
  
  if (lowerUnit.includes('foot') || lowerUnit.includes('feet') || lowerUnit.includes('ft')) {
    return 'ft';
  } else if (lowerUnit.includes('meter') || lowerUnit.includes('metre')) {
    return 'm';
  } else if (lowerUnit.includes('kilomet')) {
    return 'km';
  }
  
  return 'm'; // default to meters
}
