import type { CRSItem } from '../../types';

export const AFRICA_CRS: CRSItem[] = [
  { code: "2046", name: "Hartebeesthoek94 / Lo19", area: "South Africa - West", type: "Projected", unit: "Meter", latLong: "30.0°S, 19.0°E", projection: "Transverse Mercator", datum: "Hartebeesthoek94" },
  { code: "26332", name: "Minna / UTM zone 32N", area: "Nigeria", type: "Projected", unit: "Meter", latLong: "10.0°N, 9.0°E", projection: "Transverse Mercator", datum: "Minna" },

  // Compound CRSs
  {
    code: "9503",
    name: "Hartebeesthoek94 / Lo19 + MSL height",
    area: "South Africa - West",
    type: "Compound",
    unit: "Meter",
    latLong: "30.0°S, 19.0°E",
    projection: "Transverse Mercator",
    datum: "Hartebeesthoek94",
    verticalDatum: "MSL",
    horizontalComponent: "Hartebeesthoek94 / Lo19",
    verticalComponent: "MSL height",
    horizontalCode: "2046",
    verticalCode: "5715"
  },
  {
    code: "9504",
    name: "Minna / UTM zone 32N + Lagos 1955 height",
    area: "Nigeria",
    type: "Compound",
    unit: "Meter",
    latLong: "10.0°N, 9.0°E",
    projection: "Transverse Mercator",
    datum: "Minna",
    verticalDatum: "Lagos 1955",
    horizontalComponent: "Minna / UTM zone 32N",
    verticalComponent: "Lagos 1955 height",
    horizontalCode: "26332",
    verticalCode: "5796"
  },
  {
    code: "9505",
    name: "WGS 84 / UTM zone 36S + MSL height",
    area: "Africa - East (Kenya, Tanzania)",
    type: "Compound",
    unit: "Meter",
    latLong: "3.0°S, 33.0°E",
    projection: "Transverse Mercator",
    datum: "WGS 84",
    verticalDatum: "MSL",
    horizontalComponent: "WGS 84 / UTM zone 36S",
    verticalComponent: "MSL height",
    horizontalCode: "32736",
    verticalCode: "5715"
  }
];