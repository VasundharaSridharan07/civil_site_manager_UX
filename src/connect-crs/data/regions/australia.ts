import type { CRSItem } from '../../types';

export const AUSTRALIA_CRS: CRSItem[] = [
  { code: "4283", name: "GDA94", area: "Australia", type: "Geographic 2D", unit: "Angular", latLong: "-" },
  { code: "7844", name: "GDA2020", area: "Australia", type: "Geographic 2D", unit: "Angular", latLong: "-" },
  
  // GDA2020 MGA Zones (Selected Common Zones)
  { code: "7854", name: "GDA2020 / MGA zone 54", area: "Australia - 138°E to 144°E", type: "Projected", unit: "Meter", latLong: "30.0°S, 141.0°E", projection: "Transverse Mercator", datum: "GDA2020" },
  { code: "7855", name: "GDA2020 / MGA zone 55", area: "Australia - 144°E to 150°E", type: "Projected", unit: "Meter", latLong: "37.0°S, 147.0°E", projection: "Transverse Mercator", datum: "GDA2020" },
  { code: "7856", name: "GDA2020 / MGA zone 56", area: "Australia - 150°E to 156°E", type: "Projected", unit: "Meter", latLong: "28.0°S, 153.0°E", projection: "Transverse Mercator", datum: "GDA2020" },

  // New Zealand
  { code: "2193", name: "NZGD2000 / New Zealand Transverse Mercator 2000", area: "New Zealand", type: "Projected", unit: "Meter", latLong: "42.0°S, 173.0°E", projection: "Transverse Mercator", datum: "NZGD2000" },

  // Compound CRSs
  {
    code: "9463",
    name: "GDA2020 / MGA zone 55 + AHD height",
    area: "Australia - Victoria, Tasmania, New South Wales",
    type: "Compound",
    unit: "Meter",
    latLong: "37.0°S, 147.0°E",
    projection: "Transverse Mercator",
    datum: "GDA2020",
    verticalDatum: "AHD",
    horizontalComponent: "GDA2020 / MGA zone 55",
    verticalComponent: "AHD height",
    horizontalCode: "7855",
    verticalCode: "5711"
  },
  {
    code: "9462",
    name: "GDA2020 / MGA zone 56 + AHD height",
    area: "Australia - Queensland, New South Wales",
    type: "Compound",
    unit: "Meter",
    latLong: "28.0°S, 153.0°E",
    projection: "Transverse Mercator",
    datum: "GDA2020",
    verticalDatum: "AHD",
    horizontalComponent: "GDA2020 / MGA zone 56",
    verticalComponent: "AHD height",
    horizontalCode: "7856",
    verticalCode: "5711"
  },
  {
    code: "9461",
    name: "GDA2020 / MGA zone 54 + AHD height",
    area: "Australia - South Australia, Northern Territory",
    type: "Compound",
    unit: "Meter",
    latLong: "30.0°S, 141.0°E",
    projection: "Transverse Mercator",
    datum: "GDA2020",
    verticalDatum: "AHD",
    horizontalComponent: "GDA2020 / MGA zone 54",
    verticalComponent: "AHD height",
    horizontalCode: "7854",
    verticalCode: "5711"
  },
  {
    code: "9449",
    name: "NZGD2000 / New Zealand Transverse Mercator 2000 + NZVD2016 height",
    area: "New Zealand",
    type: "Compound",
    unit: "Meter",
    latLong: "42.0°S, 173.0°E",
    projection: "Transverse Mercator",
    datum: "NZGD2000",
    verticalDatum: "NZVD2016",
    horizontalComponent: "NZGD2000 / New Zealand Transverse Mercator 2000",
    verticalComponent: "NZVD2016 height",
    horizontalCode: "2193",
    verticalCode: "7839"
  }
];