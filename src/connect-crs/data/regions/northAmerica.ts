import type { CRSItem } from '../../types';

export const NORTH_AMERICA_CRS: CRSItem[] = [
  // Geographics
  { code: "4269", name: "NAD83", area: "North America - USA & Canada", type: "Geographic 2D", unit: "Angular", latLong: "-" },
  { code: "6318", name: "NAD 1983 (2011)", area: "North America - USA", type: "Geographic 2D", unit: "Angular", latLong: "-" },
  { code: "4267", name: "NAD27", area: "North America - USA", type: "Geographic 2D", unit: "Angular", latLong: "-" },

  // UTM Zones (Selected Common Zones)
  { code: "26910", name: "NAD83 / UTM zone 10N", area: "North America - West Coast", type: "Projected", unit: "Meter", latLong: "40.0°N, 123.0°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26911", name: "NAD83 / UTM zone 11N", area: "North America - West", type: "Projected", unit: "Meter", latLong: "35.0°N, 117.0°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26912", name: "NAD83 / UTM zone 12N", area: "North America - Mountain", type: "Projected", unit: "Meter", latLong: "40.0°N, 111.0°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26913", name: "NAD83 / UTM zone 13N", area: "North America - Mountain", type: "Projected", unit: "Meter", latLong: "40.0°N, 105.0°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26917", name: "NAD83 / UTM zone 17N", area: "North America - East Coast", type: "Projected", unit: "Meter", latLong: "30.0°N, 81.0°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26918", name: "NAD83 / UTM zone 18N", area: "North America - East Coast", type: "Projected", unit: "Meter", latLong: "40.0°N, 75.0°W", projection: "Transverse Mercator", datum: "NAD83" },
  
  // US State Planes (Selected Representative Examples)
  { code: "26954", name: "NAD83 / Colorado Central", area: "USA - Colorado", type: "Projected", unit: "Meter", latLong: "39.0°N, 105.5°W", projection: "Lambert Conic Conformal (2SP)", datum: "NAD83" },
  { code: "2232", name: "NAD83 / Colorado Central (ftUS)", area: "USA - Colorado", type: "Projected", unit: "U.S. Survey Feet", latLong: "39.0°N, 105.5°W", projection: "Lambert Conic Conformal (2SP)", datum: "NAD83" },
  { code: "2229", name: "NAD83 / California zone 5 (ftUS)", area: "USA - California", type: "Projected", unit: "U.S. Survey Feet", latLong: "34.0°N, 118.0°W", projection: "Lambert Conic Conformal (2SP)", datum: "NAD83" },
  { code: "2277", name: "NAD83 / Texas Central (ftUS)", area: "USA - Texas", type: "Projected", unit: "U.S. Survey Feet", latLong: "31.0°N, 100.0°W", projection: "Lambert Conic Conformal (2SP)", datum: "NAD83" },
  { code: "2236", name: "NAD83 / Florida East (ftUS)", area: "USA - Florida", type: "Projected", unit: "U.S. Survey Feet", latLong: "27.0°N, 80.5°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "2260", name: "NAD83 / New York East (ftUS)", area: "USA - New York", type: "Projected", unit: "U.S. Survey Feet", latLong: "43.0°N, 74.0°W", projection: "Transverse Mercator", datum: "NAD83" },

  // Hawaii State Planes (Meters)
  { code: "26961", name: "NAD83 / Hawaii zone 1", area: "USA - Hawaii - Hawaii Island", type: "Projected", unit: "Meter", latLong: "19.5°N, 155.5°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26962", name: "NAD83 / Hawaii zone 2", area: "USA - Hawaii - Maui, Molokai, Lanai", type: "Projected", unit: "Meter", latLong: "20.8°N, 156.5°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26963", name: "NAD83 / Hawaii zone 3", area: "USA - Hawaii - Oahu", type: "Projected", unit: "Meter", latLong: "21.5°N, 158.0°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26964", name: "NAD83 / Hawaii zone 4", area: "USA - Hawaii - Kauai, Niihau", type: "Projected", unit: "Meter", latLong: "22.0°N, 159.5°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "26965", name: "NAD83 / Hawaii zone 5", area: "USA - Hawaii - Nihoa", type: "Projected", unit: "Meter", latLong: "23.0°N, 162.0°W", projection: "Transverse Mercator", datum: "NAD83" },

  // Hawaii State Planes (US Survey Feet)
  { code: "3548", name: "NAD83 / Hawaii zone 1 (ftUS)", area: "USA - Hawaii - Hawaii Island", type: "Projected", unit: "U.S. Survey Feet", latLong: "19.5°N, 155.5°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "3549", name: "NAD83 / Hawaii zone 2 (ftUS)", area: "USA - Hawaii - Maui, Molokai, Lanai", type: "Projected", unit: "U.S. Survey Feet", latLong: "20.8°N, 156.5°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "3550", name: "NAD83 / Hawaii zone 3 (ftUS)", area: "USA - Hawaii - Oahu", type: "Projected", unit: "U.S. Survey Feet", latLong: "21.5°N, 158.0°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "3551", name: "NAD83 / Hawaii zone 4 (ftUS)", area: "USA - Hawaii - Kauai, Niihau", type: "Projected", unit: "U.S. Survey Feet", latLong: "22.0°N, 159.5°W", projection: "Transverse Mercator", datum: "NAD83" },
  { code: "3552", name: "NAD83 / Hawaii zone 5 (ftUS)", area: "USA - Hawaii - Nihoa", type: "Projected", unit: "U.S. Survey Feet", latLong: "23.0°N, 162.0°W", projection: "Transverse Mercator", datum: "NAD83" },

  // Compound CRSs (North America)
  { 
    code: "6428", 
    name: "NAD83(2011) / Colorado Central (ftUS) + NAVD88 height", 
    area: "USA - Colorado", 
    type: "Compound", 
    unit: "U.S. Survey Feet", 
    latLong: "39.0°N, 105.5°W",
    projection: "Lambert Conic Conformal (2SP)",
    datum: "NAD83 (2011)",
    verticalDatum: "NAVD88",
    geoid: "GEOID12B",
    horizontalComponent: "NAD83(2011) / Colorado Central",
    verticalComponent: "NAVD88 height",
    horizontalCode: "6426",
    verticalCode: "5703"
  },
  { 
    code: "8777", 
    name: "NAD83(2011) / California zone 5 (ftUS) + NAVD88 height", 
    area: "USA - California", 
    type: "Compound", 
    unit: "U.S. Survey Feet", 
    latLong: "34.0°N, 118.0°W",
    projection: "Lambert Conic Conformal (2SP)",
    datum: "NAD83 (2011)",
    verticalDatum: "NAVD88",
    horizontalComponent: "NAD83(2011) / California zone 5 (ftUS)",
    verticalComponent: "NAVD88 height",
    horizontalCode: "6424",
    verticalCode: "5703"
  },
  {
    code: "8778",
    name: "NAD83(2011) / Texas Central (ftUS) + NAVD88 height",
    area: "USA - Texas",
    type: "Compound",
    unit: "U.S. Survey Feet",
    latLong: "31.0°N, 100.0°W",
    projection: "Lambert Conic Conformal (2SP)",
    datum: "NAD83 (2011)",
    verticalDatum: "NAVD88",
    horizontalComponent: "NAD83(2011) / Texas Central (ftUS)",
    verticalComponent: "NAVD88 height",
    horizontalCode: "6403",
    verticalCode: "5703"
  },
  {
    code: "8779",
    name: "NAD83(2011) / Florida East (ftUS) + NAVD88 height",
    area: "USA - Florida",
    type: "Compound",
    unit: "U.S. Survey Feet",
    latLong: "28.0°N, 81.0°W",
    projection: "Transverse Mercator",
    datum: "NAD83 (2011)",
    verticalDatum: "NAVD88",
    horizontalComponent: "NAD83(2011) / Florida East (ftUS)",
    verticalComponent: "NAVD88 height",
    horizontalCode: "6440",
    verticalCode: "5703"
  },
  {
    code: "8780",
    name: "NAD83(CSRS) / UTM zone 17N + CGVD2013 height",
    area: "Canada - Ontario",
    type: "Compound",
    unit: "Meter",
    latLong: "45.0°N, 81.0°W",
    projection: "Transverse Mercator",
    datum: "NAD83(CSRS)",
    verticalDatum: "CGVD2013",
    horizontalComponent: "NAD83(CSRS) / UTM zone 17N",
    verticalComponent: "CGVD2013 height",
    horizontalCode: "2958",
    verticalCode: "6647"
  },
  {
    code: "8781",
    name: "NAD83(2011) / Washington North (ftUS) + NAVD88 height",
    area: "USA - Washington",
    type: "Compound",
    unit: "U.S. Survey Feet",
    latLong: "48.0°N, 120.0°W",
    projection: "Lambert Conic Conformal (2SP)",
    datum: "NAD83 (2011)",
    verticalDatum: "NAVD88",
    horizontalComponent: "NAD83(2011) / Washington North (ftUS)",
    verticalComponent: "NAVD88 height",
    horizontalCode: "6596",
    verticalCode: "5703"
  }
];