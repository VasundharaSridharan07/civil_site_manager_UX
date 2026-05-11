import type { CRSItem } from '../types';

// We no longer import everything statically to avoid a massive initial bundle.
// Instead, we export a function that loads them on demand.

export type { CRSItem };

// Cache the promise to avoid reloading multiple times
let loadedCRSList: CRSItem[] | null = null;

export const fetchCRSData = async (): Promise<CRSItem[]> => {
  if (loadedCRSList) return loadedCRSList;

  // Parallel fetch of all regions
  const [
    { GLOBAL_CRS },
    { NORTH_AMERICA_CRS },
    { EUROPE_CRS },
    { AUSTRALIA_CRS },
    { ASIA_CRS },
    { SOUTH_AMERICA_CRS },
    { AFRICA_CRS },
    { VERTICAL_CRS, ENGINEERING_CRS }
  ] = await Promise.all([
    import('./regions/global'),
    import('./regions/northAmerica'),
    import('./regions/europe'),
    import('./regions/australia'),
    import('./regions/asia'),
    import('./regions/southAmerica'),
    import('./regions/africa'),
    import('./regions/vertical')
  ]);

  loadedCRSList = [
    ...GLOBAL_CRS,
    ...NORTH_AMERICA_CRS,
    ...EUROPE_CRS,
    ...AUSTRALIA_CRS,
    ...ASIA_CRS,
    ...SOUTH_AMERICA_CRS,
    ...AFRICA_CRS,
    ...VERTICAL_CRS,
    ...ENGINEERING_CRS
  ];

  return loadedCRSList;
};

// Keep a lightweight static list if needed for initial states, or empty
export const PUBLISHED_CRS_LIST: CRSItem[] = []; 
