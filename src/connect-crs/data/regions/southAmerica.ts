import type { CRSItem } from '../../types';

export const SOUTH_AMERICA_CRS: CRSItem[] = [
  { code: "4674", name: "SIRGAS 2000", area: "South America - Brazil", type: "Geographic 2D", unit: "Angular", latLong: "-" },
  { code: "31983", name: "SIRGAS 2000 / UTM zone 23S", area: "Brazil - East", type: "Projected", unit: "Meter", latLong: "20.0°S, 45.0°W", projection: "Transverse Mercator", datum: "SIRGAS 2000" },

  // Compound CRSs
  {
    code: "9500",
    name: "SIRGAS 2000 / UTM zone 23S + Imbituba height",
    area: "Brazil - East",
    type: "Compound",
    unit: "Meter",
    latLong: "20.0°S, 45.0°W",
    projection: "Transverse Mercator",
    datum: "SIRGAS 2000",
    verticalDatum: "Imbituba",
    horizontalComponent: "SIRGAS 2000 / UTM zone 23S",
    verticalComponent: "Imbituba height",
    horizontalCode: "31983",
    verticalCode: "5724"
  },
  {
    code: "9501",
    name: "SIRGAS-Chile 2002 / UTM zone 19S + Valparaiso height",
    area: "Chile - Central",
    type: "Compound",
    unit: "Meter",
    latLong: "33.0°S, 70.0°W",
    projection: "Transverse Mercator",
    datum: "SIRGAS-Chile",
    verticalDatum: "Valparaiso",
    horizontalComponent: "SIRGAS-Chile 2002 / UTM zone 19S",
    verticalComponent: "Valparaiso height",
    horizontalCode: "5361",
    verticalCode: "5730"
  },
  {
    code: "9502",
    name: "SIRGAS 2000 / UTM zone 21S + Buenos Aires height",
    area: "Argentina - Buenos Aires",
    type: "Compound",
    unit: "Meter",
    latLong: "35.0°S, 58.0°W",
    projection: "Transverse Mercator",
    datum: "SIRGAS 2000",
    verticalDatum: "Buenos Aires",
    horizontalComponent: "SIRGAS 2000 / UTM zone 21S",
    verticalComponent: "Buenos Aires height",
    horizontalCode: "31981",
    verticalCode: "5734"
  }
];