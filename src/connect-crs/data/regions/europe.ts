import type { CRSItem } from '../../types';

export const EUROPE_CRS: CRSItem[] = [
  { code: "4258", name: "ETRS89", area: "Europe", type: "Geographic 2D", unit: "Angular", latLong: "-" },
  
  // UTM Zones (Selected)
  { code: "25830", name: "ETRS89 / UTM zone 30N", area: "Europe - West", type: "Projected", unit: "Meter", latLong: "50.0°N, 3.0°W", projection: "Transverse Mercator", datum: "ETRS89" },
  { code: "25831", name: "ETRS89 / UTM zone 31N", area: "Europe - Central West", type: "Projected", unit: "Meter", latLong: "50.0°N, 3.0°E", projection: "Transverse Mercator", datum: "ETRS89" },
  { code: "25832", name: "ETRS89 / UTM zone 32N", area: "Europe - Central", type: "Projected", unit: "Meter", latLong: "50.0°N, 9.0°E", projection: "Transverse Mercator", datum: "ETRS89" },
  { code: "25833", name: "ETRS89 / UTM zone 33N", area: "Europe - Central East", type: "Projected", unit: "Meter", latLong: "50.0°N, 15.0°E", projection: "Transverse Mercator", datum: "ETRS89" },
  
  // National Grids
  { code: "27700", name: "OSGB36 / British National Grid", area: "United Kingdom", type: "Projected", unit: "Meter", latLong: "52.5°N, 2.0°W", projection: "Transverse Mercator", datum: "OSGB 1936", horizontalComponent: "British National Grid" },
  { code: "27700-OSTN15", name: "OS National Grid (OSTN15)", area: "United Kingdom", type: "Projected", unit: "Meter", latLong: "52.5°N, 2.0°W", projection: "Transverse Mercator", datum: "OSGB 1936 (OSTN15)", horizontalComponent: "British National Grid" },
  { code: "2157", name: "IRENET95 / Irish Transverse Mercator", area: "Ireland", type: "Projected", unit: "Meter", latLong: "53.5°N, 8.0°W", projection: "Transverse Mercator", datum: "IRENET95" },
  { code: "2154", name: "RGF93 / Lambert-93", area: "France", type: "Projected", unit: "Meter", latLong: "46.5°N, 2.5°E", projection: "Lambert Conic Conformal (2SP)", datum: "RGF93" },
  { code: "31467", name: "DHDN / 3-degree Gauss-Kruger zone 3", area: "Germany - Central", type: "Projected", unit: "Meter", latLong: "50.0°N, 9.0°E", projection: "Transverse Mercator", datum: "DHDN" },
  { code: "3003", name: "Monte Mario / Italy zone 1", area: "Italy - West", type: "Projected", unit: "Meter", latLong: "42.0°N, 10.0°E", projection: "Transverse Mercator", datum: "Monte Mario" },
  { code: "28992", name: "Amersfoort / RD New", area: "Netherlands", type: "Projected", unit: "Meter", latLong: "52.0°N, 5.0°E", projection: "Oblique Stereographic", datum: "Amersfoort" },
  { code: "3006", name: "SWEREF99 TM", area: "Sweden", type: "Projected", unit: "Meter", latLong: "62.0°N, 15.0°E", projection: "Transverse Mercator", datum: "SWEREF99" },

  // Compound CRSs
  {
    code: "7405",
    name: "OSGB36 / British National Grid + ODN height",
    area: "United Kingdom (UK) - Great Britain",
    type: "Compound",
    unit: "Meter",
    latLong: "52.5°N, 2.0°W",
    projection: "Transverse Mercator",
    datum: "OSGB 1936",
    verticalDatum: "ODN",
    horizontalComponent: "OSGB36 / British National Grid",
    verticalComponent: "ODN height",
    horizontalCode: "27700",
    verticalCode: "5701"
  },
  {
    code: "6943",
    name: "RGF93 / Lambert-93 + NGF-IGN69 height",
    area: "France",
    type: "Compound",
    unit: "Meter",
    latLong: "46.5°N, 2.5°E",
    projection: "Lambert Conic Conformal (2SP)",
    datum: "RGF93",
    verticalDatum: "NGF-IGN69",
    horizontalComponent: "RGF93 / Lambert-93",
    verticalComponent: "NGF-IGN69 height",
    horizontalCode: "2154",
    verticalCode: "5720"
  },
  {
    code: "9423",
    name: "ETRS89 / UTM zone 32N + DVR90 height",
    area: "Denmark",
    type: "Compound",
    unit: "Meter",
    latLong: "56.0°N, 10.0°E",
    projection: "Transverse Mercator",
    datum: "ETRS89",
    verticalDatum: "DVR90",
    horizontalComponent: "ETRS89 / UTM zone 32N",
    verticalComponent: "DVR90 height",
    horizontalCode: "25832",
    verticalCode: "5799"
  },
  {
    code: "5555",
    name: "SWEREF99 TM + RH2000 height",
    area: "Sweden",
    type: "Compound",
    unit: "Meter",
    latLong: "62.0°N, 15.0°E",
    projection: "Transverse Mercator",
    datum: "SWEREF99",
    verticalDatum: "RH2000",
    horizontalComponent: "SWEREF99 TM",
    verticalComponent: "RH2000 height",
    horizontalCode: "3006",
    verticalCode: "5613"
  },
  {
    code: "9707",
    name: "ETRS89 / UTM zone 33N + NN2000 height",
    area: "Norway",
    type: "Compound",
    unit: "Meter",
    latLong: "60.0°N, 10.5°E",
    projection: "Transverse Mercator",
    datum: "ETRS89",
    verticalDatum: "NN2000",
    horizontalComponent: "ETRS89 / UTM zone 33N",
    verticalComponent: "NN2000 height",
    horizontalCode: "25833",
    verticalCode: "5941"
  },
  {
    code: "9500",
    name: "ETRS89 / UTM zone 32N + DHHN2016 height",
    area: "Germany",
    type: "Compound",
    unit: "Meter",
    latLong: "51.0°N, 10.5°E",
    projection: "Transverse Mercator",
    datum: "ETRS89",
    verticalDatum: "DHHN2016",
    horizontalComponent: "ETRS89 / UTM zone 32N",
    verticalComponent: "DHHN2016 height",
    horizontalCode: "25832",
    verticalCode: "7837"
  },
  {
    code: "9518",
    name: "ETRS89 / UTM zone 33N + Alicante height",
    area: "Spain",
    type: "Compound",
    unit: "Meter",
    latLong: "40.0°N, 3.5°W",
    projection: "Transverse Mercator",
    datum: "ETRS89",
    verticalDatum: "Alicante",
    horizontalComponent: "ETRS89 / UTM zone 33N",
    verticalComponent: "Alicante height",
    horizontalCode: "25833",
    verticalCode: "5782"
  }
];