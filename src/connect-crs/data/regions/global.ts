import type { CRSItem } from '../../types';

export const GLOBAL_CRS: CRSItem[] = [
  { 
    code: "4326", 
    name: "WGS 84", 
    area: "World", 
    type: "Geographic 2D", 
    unit: "Angular", 
    latLong: "Global",
    datum: "WGS 84"
  },
  { 
    code: "3857", 
    name: "WGS 84 / Pseudo-Mercator", 
    area: "World", 
    type: "Projected", 
    unit: "Meter", 
    latLong: "Global",
    projection: "Pseudo-Mercator",
    datum: "WGS 84"
  },
  { 
    code: "4978", 
    name: "WGS 84 (Geocentric)", 
    area: "World", 
    type: "Geocentric", 
    unit: "Meter", 
    latLong: "Global",
    datum: "WGS 84"
  },
  {
    code: "4979",
    name: "WGS 84 (3D)",
    area: "World",
    type: "Geographic 3D",
    unit: "Angular",
    latLong: "Global",
    datum: "WGS 84"
  }
];
