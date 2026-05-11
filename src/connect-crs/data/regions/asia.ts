import type { CRSItem } from '../../types';

export const ASIA_CRS: CRSItem[] = [
  // Japan
  { code: "6668", name: "JGD2011", area: "Japan", type: "Geographic 2D", unit: "Angular", latLong: "36.0°N, 138.0°E" },
  { code: "6677", name: "JGD2011 / Japan Plane Rectangular CS IX", area: "Japan - Tokyo", type: "Projected", unit: "Meter", latLong: "36.0°N, 140.0°E", projection: "Transverse Mercator", datum: "JGD2011" },
  
  // China
  { code: "4490", name: "CGCS2000", area: "China", type: "Geographic 2D", unit: "Angular", latLong: "-" },
  
  // Hong Kong / Singapore
  { code: "2326", name: "Hong Kong 1980 Grid", area: "Hong Kong", type: "Projected", unit: "Meter", latLong: "22.3°N, 114.1°E", projection: "Transverse Mercator", datum: "Hong Kong 1980" },
  { code: "3414", name: "SVY21 / Singapore TM", area: "Singapore", type: "Projected", unit: "Meter", latLong: "1.3°N, 103.8°E", projection: "Transverse Mercator", datum: "SVY21" },

  // Compound CRSs
  {
    code: "10166",
    name: "JGD2011 / Japan Plane Rectangular CS IX + JGD2011 (vertical) height",
    area: "Japan - Tokyo",
    type: "Compound",
    unit: "Meter",
    latLong: "36.0°N, 140.0°E",
    projection: "Transverse Mercator",
    datum: "JGD2011",
    verticalDatum: "JGD2011 (vertical)",
    horizontalComponent: "JGD2011 / Japan Plane Rectangular CS IX",
    verticalComponent: "JGD2011 (vertical) height",
    horizontalCode: "6677",
    verticalCode: "6695"
  },
  {
    code: "9470",
    name: "Hong Kong 1980 Grid + Hong Kong Principal Datum height",
    area: "Hong Kong",
    type: "Compound",
    unit: "Meter",
    latLong: "22.3°N, 114.1°E",
    projection: "Transverse Mercator",
    datum: "Hong Kong 1980",
    verticalDatum: "Hong Kong Principal Datum",
    horizontalComponent: "Hong Kong 1980 Grid",
    verticalComponent: "Hong Kong Principal Datum height",
    horizontalCode: "2326",
    verticalCode: "5738"
  },
  {
    code: "9471",
    name: "SVY21 / Singapore TM + Singapore Height Datum height",
    area: "Singapore",
    type: "Compound",
    unit: "Meter",
    latLong: "1.3°N, 103.8°E",
    projection: "Transverse Mercator",
    datum: "SVY21",
    verticalDatum: "Singapore Height Datum",
    horizontalComponent: "SVY21 / Singapore TM",
    verticalComponent: "Singapore Height Datum height",
    horizontalCode: "3414",
    verticalCode: "6916"
  }
];