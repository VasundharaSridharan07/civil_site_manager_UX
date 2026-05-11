/**
 * Published CRS source: TGR (local tgr.db / crs-tgr.json) or CSD (Coordinates Service API).
 * Preference is persisted in localStorage.
 */

import type { CRSItem } from '../types';
import { fetchPublishedCRSFromApi, type FetchPublishedCRSOptions } from './crsApi';
import { fetchPublishedCRSFromTgr } from './tgrCrsData';

export type { FetchPublishedCRSOptions };

export type PublishedCrsSource = 'TGR' | 'CSD';

const STORAGE_KEY = 'publishedCrsSource';

export function getPublishedCrsSource(): PublishedCrsSource {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'TGR' || s === 'CSD') return s;
  } catch {
    /* ignore */
  }
  return 'CSD';
}

export function setPublishedCrsSource(source: PublishedCrsSource): void {
  try {
    localStorage.setItem(STORAGE_KEY, source);
    window.dispatchEvent(new CustomEvent('publishedCrsSourceChange', { detail: source }));
  } catch {
    /* ignore */
  }
}

/** True when the selected source supports search (both TGR and CSD do). */
export function isPublishedCrsSourceSearchable(): boolean {
  return true;
}

export async function fetchPublishedCRS(options?: FetchPublishedCRSOptions): Promise<CRSItem[]> {
  const source = getPublishedCrsSource();
  if (source === 'TGR') {
    return fetchPublishedCRSFromTgr(options);
  }
  return fetchPublishedCRSFromApi(options);
}
