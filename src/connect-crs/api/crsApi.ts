// @ts-nocheck
import type { CRSItem, LocalSiteSettings, SiteCalibrationSettings } from '../types';
import { formatLatForDisplay, formatLongForDisplay } from '../utils/geoUtils';

const DEFAULT_BASE_URL = '/api/crs';

function getBaseUrl(): string {
  return import.meta.env?.VITE_PUBLISHED_CRS_API_URL ?? DEFAULT_BASE_URL;
}

export interface FetchPublishedCRSOptions {
  /** Text search query (sent as textMatch to Coords Service). */
  textMatch?: string;
  /** EPSG code search (sent as epsgCodeMatch to Coords Service). When set, search is by code only. */
  epsgCodeMatch?: string | number;
  proximityLatitude?: number;
  proximityLongitude?: number;
}

/** Raw shape from Trimble /coordinatesystems API (subset we use). */
interface TrimbleZoneInfo {
  zoneGroupName?: string;
  zoneName?: string;
  zoneType?: string;
  extents?: string | { minLat?: number; maxLat?: number; minLon?: number; maxLon?: number };
}

interface TrimbleGeoidInfo {
  geoidName?: string;
}

interface TrimbleDatumInfo {
  datumName?: string;
}

interface TrimbleCoordinatesystemRecord {
  id?: string;
  systemId?: string;
  projEPSG?: string;
  systemName?: string;
  recordName?: string;
  planeUnitName?: string;
  isGeographicSystem?: boolean;
  zoneInfo?: TrimbleZoneInfo;
  geoidInfo?: TrimbleGeoidInfo;
  datumInfo?: TrimbleDatumInfo;
}

function formatUnit(planeUnitName: string | undefined): string {
  if (!planeUnitName) return 'Meter';
  if (planeUnitName === 'Metres') return 'Meter';
  if (planeUnitName === 'USSurveyFeet') return 'U.S. Survey Feet';
  return planeUnitName;
}

function formatExtents(extents: TrimbleZoneInfo['extents']): string {
  if (!extents) return '-';
  if (typeof extents === 'string') return extents;
  const { minLat, maxLat, minLon, maxLon } = extents;
  if (minLat != null && maxLat != null && minLon != null && maxLon != null) {
    return `${minLat}, ${maxLat}, ${minLon}, ${maxLon}`;
  }
  return '-';
}

function mapRecordToCRSItem(record: TrimbleCoordinatesystemRecord): CRSItem {
  const zoneInfo = record.zoneInfo ?? {};
  const geoidInfo = record.geoidInfo ?? {};
  const datumInfo = record.datumInfo ?? {};

  const code =
    record.projEPSG ?? record.systemId ?? '';

  const name =
    zoneInfo.zoneGroupName && zoneInfo.zoneName
      ? `${zoneInfo.zoneGroupName} - ${zoneInfo.zoneName}`
      : record.systemName && record.recordName
        ? `${record.systemName} - ${record.recordName}`
        : record.systemName ?? record.recordName ?? record.systemId ?? '';

  const geoidName = geoidInfo.geoidName ?? '';

  return {
    code: String(code),
    name,
    area: formatExtents(zoneInfo.extents),
    type: record.isGeographicSystem ? 'Geographic' : 'Projected',
    unit: formatUnit(record.planeUnitName),
    latLong: formatExtents(zoneInfo.extents),
    projection: zoneInfo.zoneType ?? undefined,
    datum: datumInfo.datumName ?? undefined,
    verticalDatum: geoidName || undefined,
    geoid: geoidName || undefined,
    horizontalComponent: name,
    verticalComponent: geoidName || undefined,
    horizontalCode: record.projEPSG ?? record.systemId ?? undefined,
    verticalCode: undefined,
  };
}

export function isPublishedCRSApiConfigured(): boolean {
  return true;
}

export async function fetchPublishedCRSFromApi(
  options?: FetchPublishedCRSOptions
): Promise<CRSItem[]> {
  const base = getBaseUrl().replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('includeHidden', 'false');
  const epsgCode = options?.epsgCodeMatch != null && String(options.epsgCodeMatch).trim() !== ''
    ? String(options.epsgCodeMatch).trim()
    : undefined;
  if (epsgCode != null) {
    params.set('epsgCodeMatch', epsgCode);
  }
  if (options?.textMatch != null && options.textMatch.trim() !== '' && epsgCode == null) {
    params.set('textMatch', options.textMatch.trim());
  }
  if (options?.proximityLatitude != null) {
    params.set('proximityLatitude', String(options.proximityLatitude));
  }
  if (options?.proximityLongitude != null) {
    params.set('proximityLongitude', String(options.proximityLongitude));
  }
  const url = `${base}/coordinatesystems?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Published CRS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const records: TrimbleCoordinatesystemRecord[] = Array.isArray(data) ? data : data?.items ?? data?.results ?? [];
  return records.map(mapRecordToCRSItem);
}

// --- JXL file import (PUT file to /coordinatesystems/imports/jxl/file) ---

export interface JxlImportExtents {
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
}

export interface JxlImportParsedCRS {
  horizontalName: string;
  horizontalCode: string;
  verticalName: string;
  verticalCode: string;
  datum: string;
  verticalDatum: string;
  unit?: string;
  localSite?: LocalSiteSettings;
  calibration?: SiteCalibrationSettings;
  extents?: JxlImportExtents;
}

/** Response shape from Trimble JXL import API (subset we use). */
interface JxlImportDatumInfo {
  datumName?: string;
}

interface JxlImportGeoidInfo {
  geoidName?: string;
}

/** Local site parameters from API (lives at zoneInfo.localSiteParameters). */
interface JxlImportLocalSiteParameters {
  locationLatitude?: number;
  locationLongitude?: number;
  locationHeight?: number;
  groundScalefactor?: number;
  groundScaleFactor?: number;
  northingOffset?: number;
  eastingOffset?: number;
  isNullSite?: boolean;
  isValid?: boolean;
}

/** Horizontal/vertical adjustment from API (zoneInfo.horizontalAdjustment / verticalAdjustment). */
interface JxlImportAdjustment {
  translationNorth?: number;
  translationEast?: number;
  constantAdjustment?: number;
  originNorth?: number;
  originEast?: number;
  scale?: number;
  rotation?: number;
  slopeNorth?: number;
  slopeEast?: number;
  isNullAdjustment?: boolean;
}

interface JxlImportZoneInfo {
  zoneType?: string;
  zoneName?: string;
  zoneGroupName?: string;
  originLatitude?: number;
  originLongitude?: number;
  localSiteParameters?: JxlImportLocalSiteParameters;
  horizontalAdjustment?: JxlImportAdjustment;
  verticalAdjustment?: JxlImportAdjustment;
  extents?: JxlImportExtents;
}


interface JxlImportCoordinateSystem {
  id?: string;
  systemId?: number;
  systemName?: string;
  recordName?: string;
  datumInfo?: JxlImportDatumInfo;
  zoneInfo?: JxlImportZoneInfo;
  geoidInfo?: JxlImportGeoidInfo;
  isGeographicSystem?: boolean;
  planeUnitName?: string;
  angularUnitName?: string;
  verticalUnitName?: string;
}

interface JxlImportResponse {
  coordinateSystem?: JxlImportCoordinateSystem;
}

function formatUnitFromJxl(planeUnitName: string | undefined): string {
  if (!planeUnitName) return 'Meter';
  if (planeUnitName === 'Metres') return 'Meter';
  if (planeUnitName === 'USSurveyFeet') return 'U.S. Survey Feet';
  if (planeUnitName === 'Degree') return 'Angular';
  return planeUnitName;
}

/**
 * PUT a file to a Trimble import endpoint (jxl or dc). Same request/response shape for both.
 * Request: PUT with multipart/form-data, field name "file".
 * Response: JSON array of { coordinateSystem, csib }; we use the first element.
 */
async function importFileToEndpoint(
  file: File,
  endpoint: 'jxl' | 'dc',
  errorLabel: string
): Promise<JxlImportParsedCRS> {
  const base = getBaseUrl().replace(/\/$/, '');
  const url = `${base}/coordinatesystems/imports/${endpoint}/file`;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'PUT',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${errorLabel} import failed: ${response.status} ${response.statusText}${text ? ` - ${text.slice(0, 200)}` : ''}`);
  }

  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : data;
  const cs = (first as JxlImportResponse)?.coordinateSystem;
  if (!cs) {
    throw new Error(`${errorLabel} import returned no coordinate system.`);
  }

  const datumInfo = cs.datumInfo ?? {};
  const zoneInfo = cs.zoneInfo ?? {};
  const datumName = datumInfo.datumName ?? '';
  const zoneType = zoneInfo.zoneType ?? '';
  const zoneName = zoneInfo.zoneName ?? '';
  const systemName = cs.systemName ?? '';
  const recordName = cs.recordName ?? '';

  const zoneGroupName = zoneInfo.zoneGroupName ?? '';
  const id = cs.id;
  const safeStr = (v: string | undefined) => (v && v !== id ? v : '');
  const horizontalName =
    (zoneGroupName && zoneName ? `${zoneGroupName} - ${zoneName}` : null) ||
    safeStr(zoneName) || safeStr(systemName) || safeStr(recordName) || safeStr(zoneType) || (cs.isGeographicSystem ? 'Geographic' : 'Projected') || 'Imported CRS';
  const horizontalCode = cs.systemId != null && cs.systemId >= 0 ? `EPSG:${cs.systemId}` : '-';

  const unit = formatUnitFromJxl(cs.planeUnitName ?? cs.verticalUnitName);

  const geoidName = cs.geoidInfo?.geoidName ?? '';
  const verticalName =
    geoidName || (cs.verticalUnitName ? `${cs.verticalUnitName} height` : 'Not defined');

  const unitStr = unit || 'Meter';
  const unitSuffix = unitStr === 'Meter' ? ' m' : unitStr === 'U.S. Survey Feet' ? ' sft' : ' ft';

  // localSiteParameters lives at zoneInfo.localSiteParameters (per API response)
  const lsp = zoneInfo.localSiteParameters;
  const hAdj = zoneInfo.horizontalAdjustment;
  const vAdj = zoneInfo.verticalAdjustment;
  let localSite: LocalSiteSettings | undefined;
  let calibration: SiteCalibrationSettings | undefined;

  const radToDeg = (rad: number) => (rad * 180) / Math.PI;

  if (lsp && typeof lsp === 'object' && !lsp.isNullSite) {
    const toStr = (v: number | string | undefined): string =>
      v === undefined || v === null ? '-' : String(v);
    const withUnit = (v: number | undefined): string =>
      v === undefined || v === null ? '-' : String(v) + unitSuffix;
    const latRad = lsp.locationLatitude;
    const lngRad = lsp.locationLongitude;
    const latStr = latRad != null ? formatLatForDisplay(radToDeg(latRad)) : '-';
    const lngStr = lngRad != null ? formatLongForDisplay(radToDeg(lngRad)) : '-';
    const scale = lsp.groundScalefactor ?? lsp.groundScaleFactor;
    localSite = {
      projectLatitude: latStr,
      projectLongitude: lngStr,
      projectHeight: withUnit(lsp.locationHeight),
      groundScaleFactor: toStr(scale),
      northingOffset: withUnit(lsp.northingOffset),
      eastingOffset: withUnit(lsp.eastingOffset),
    };
  }

  if ((hAdj && !hAdj.isNullAdjustment) || (vAdj && !vAdj.isNullAdjustment)) {
    const withUnit = (v: number | undefined): string =>
      v === undefined || v === null ? '-' : String(v) + unitSuffix;
    const hNorth = hAdj?.translationNorth;
    const hEast = hAdj?.translationEast;
    const northStr = hNorth != null
      ? (hNorth >= 0 ? `${hNorth.toFixed(8)} N` : `${(-hNorth).toFixed(8)} S`)
      : '';
    const eastStr = hEast != null
      ? (hEast >= 0 ? `${hEast.toFixed(8)} E` : `${(-hEast).toFixed(8)} W`)
      : '';
    const hStr = northStr && eastStr ? `${northStr}, ${eastStr}` : northStr || eastStr || '-';
    const vStr = vAdj?.constantAdjustment != null
      ? vAdj.constantAdjustment.toFixed(3) + unitSuffix
      : '-';
    calibration = {
      horizontalAdjustment: hStr,
      verticalAdjustment: vStr,
    };
  }

  return {
    horizontalName,
    horizontalCode,
    verticalName,
    verticalCode: '-',
    datum: datumName || 'Not defined',
    verticalDatum: geoidName || (cs.verticalUnitName ?? ''),
    unit,
    localSite,
    calibration,
    extents: zoneInfo.extents,
  };
}

/** JXL file import: PUT to /coordinatesystems/imports/jxl/file. Same model and UI as CAL. */
export async function importJxlFile(file: File): Promise<JxlImportParsedCRS> {
  return importFileToEndpoint(file, 'jxl', 'JXL');
}

/** CAL file import: PUT to /coordinatesystems/imports/dc/file. Same model and UI as JXL. */
export async function importCalFile(file: File): Promise<JxlImportParsedCRS> {
  return importFileToEndpoint(file, 'dc', 'CAL');
}
