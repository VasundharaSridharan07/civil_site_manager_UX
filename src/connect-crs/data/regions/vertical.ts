import type { CRSItem } from '../../types';

export const VERTICAL_CRS: CRSItem[] = [
  { code: "5703", name: "NAVD88 height", area: "North America - USA", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "6360", name: "NAVD88 height (ftUS)", area: "North America - USA", type: "Vertical", unit: "U.S. Survey Feet", latLong: "-" },
  { code: "5702", name: "NGVD29 height (ftUS)", area: "North America - USA", type: "Vertical", unit: "U.S. Survey Feet", latLong: "-" },
  { code: "5773", name: "EGM96 geoid height", area: "World", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "3855", name: "EGM2008 geoid height", area: "World", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "5621", name: "EVRF2007 height", area: "Europe", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "5711", name: "AHD height", area: "Australia", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "5712", name: "AHD height (Tasmania)", area: "Australia - Tasmania", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "5730", name: "N2000 height", area: "Finland", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "5776", name: "RH2000 height", area: "Sweden", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "5195", name: "NN2000 height", area: "Norway", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "5714", name: "MSL height", area: "World", type: "Vertical", unit: "Meter", latLong: "-" },
  { code: "5715", name: "MSL height (ftUS)", area: "World", type: "Vertical", unit: "U.S. Survey Feet", latLong: "-" }
];

export const ENGINEERING_CRS: CRSItem[] = [
  { code: "10001", name: "Custom Construction Grid", area: "Site Local", type: "Engineering", unit: "Not defined", latLong: "-" }
];