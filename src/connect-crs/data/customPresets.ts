import type { CRSItem } from '../types';

// These are custom, non-EPSG official combinations of valid Horizontal and Vertical systems.
// They are stored here for potential future use or custom presets menus, 
// ensuring they are not mixed with official EPSG data in the main lists.

export const CUSTOM_PRESETS: CRSItem[] = [
  // Hawaii Compound CRSs
  { 
    code: "3548-MSL", 
    name: "NAD83 / Hawaii zone 1 (ftUS) + MSL height", 
    area: "USA - Hawaii - Hawaii Island", 
    type: "Compound", 
    unit: "U.S. Survey Feet", 
    latLong: "19.5°N, 155.5°W",
    projection: "Transverse Mercator",
    datum: "NAD83",
    verticalDatum: "MSL",
    horizontalComponent: "NAD83 / Hawaii zone 1 (ftUS)",
    verticalComponent: "MSL height (ftUS)",
    horizontalCode: "3548",
    verticalCode: "5715"
  },
  { 
    code: "3549-MSL", 
    name: "NAD83 / Hawaii zone 2 (ftUS) + MSL height", 
    area: "USA - Hawaii - Maui, Molokai, Lanai", 
    type: "Compound", 
    unit: "U.S. Survey Feet", 
    latLong: "20.8°N, 156.5°W",
    projection: "Transverse Mercator",
    datum: "NAD83",
    verticalDatum: "MSL",
    horizontalComponent: "NAD83 / Hawaii zone 2 (ftUS)",
    verticalComponent: "MSL height (ftUS)",
    horizontalCode: "3549",
    verticalCode: "5715"
  },
  { 
    code: "3550-MSL", 
    name: "NAD83 / Hawaii zone 3 (ftUS) + MSL height", 
    area: "USA - Hawaii - Oahu", 
    type: "Compound", 
    unit: "U.S. Survey Feet", 
    latLong: "21.5°N, 158.0°W",
    projection: "Transverse Mercator",
    datum: "NAD83",
    verticalDatum: "MSL",
    horizontalComponent: "NAD83 / Hawaii zone 3 (ftUS)",
    verticalComponent: "MSL height (ftUS)",
    horizontalCode: "3550",
    verticalCode: "5715"
  },
  { 
    code: "3551-MSL", 
    name: "NAD83 / Hawaii zone 4 (ftUS) + MSL height", 
    area: "USA - Hawaii - Kauai, Niihau", 
    type: "Compound", 
    unit: "U.S. Survey Feet", 
    latLong: "22.0°N, 159.5°W",
    projection: "Transverse Mercator",
    datum: "NAD83",
    verticalDatum: "MSL",
    horizontalComponent: "NAD83 / Hawaii zone 4 (ftUS)",
    verticalComponent: "MSL height (ftUS)",
    horizontalCode: "3551",
    verticalCode: "5715"
  },
  { 
    code: "3552-MSL", 
    name: "NAD83 / Hawaii zone 5 (ftUS) + MSL height", 
    area: "USA - Hawaii - Nihoa", 
    type: "Compound", 
    unit: "U.S. Survey Feet", 
    latLong: "23.0°N, 162.0°W",
    projection: "Transverse Mercator",
    datum: "NAD83",
    verticalDatum: "MSL",
    horizontalComponent: "NAD83 / Hawaii zone 5 (ftUS)",
    verticalComponent: "MSL height (ftUS)",
    horizontalCode: "3552",
    verticalCode: "5715"
  },

  // Mock Data for Testing
  {
    code: "99901",
    name: "Trimble Campus Grid (Meters)",
    area: "USA - Colorado - Westminster",
    type: "Compound",
    unit: "Meter",
    latLong: "39.88°N, 105.08°W",
    projection: "Transverse Mercator",
    datum: "NAD83 (2011)",
    verticalDatum: "NAVD88",
    horizontalComponent: "Trimble Local",
    verticalComponent: "NAVD88 height",
    horizontalCode: "99001",
    verticalCode: "5703"
  },
  {
    code: "99902",
    name: "Trimble Campus Grid (US Feet)",
    area: "USA - Colorado - Westminster",
    type: "Compound",
    unit: "U.S. Survey Feet",
    latLong: "39.88°N, 105.08°W",
    projection: "Transverse Mercator",
    datum: "NAD83 (2011)",
    verticalDatum: "NAVD88",
    horizontalComponent: "Trimble Local",
    verticalComponent: "NAVD88 height",
    horizontalCode: "99002",
    verticalCode: "6360"
  },
  
  // Custom UK Combinations
  {
    code: "27700-OSTN15", 
    name: "OS National Grid (OSTN15)", 
    area: "United Kingdom - Great Britain", 
    type: "Projected", 
    unit: "Meter", 
    latLong: "52.5°N, 2.0°W", 
    projection: "Transverse Mercator", 
    datum: "OSGB 1936 (OSTN15)", 
    horizontalComponent: "British National Grid"
  },
  {
    code: "7405-OSTN15",
    name: "OS National Grid (OSTN15) + ODN height (OSGM15)",
    area: "United Kingdom - Great Britain",
    type: "Compound",
    unit: "Meter",
    latLong: "52.5°N, 2.0°W",
    projection: "Transverse Mercator",
    datum: "OSGB 1936 (OSTN15)",
    verticalDatum: "ODN (OSGM15)",
    horizontalComponent: "OS National Grid (OSTN15)",
    verticalComponent: "ODN height (OSGM15)",
    horizontalCode: "27700-OSTN15",
    verticalCode: "5701-15"
  },
  
  // Australia Custom
  {
    code: "9463",
    name: "GDA2020 / MGA zone 55 + AHD height",
    area: "Australia - Victoria; NSW",
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

  // Asia Custom
  {
    code: "6696",
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
    verticalCode: "6666"
  },

  // South America Custom
  {
    code: "9988",
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
    verticalCode: "5738"
  },

  // Africa Custom
  {
    code: "9221",
    name: "Hartebeesthoek94 / Lo19 + Land Levelling Datum height",
    area: "South Africa - West",
    type: "Compound",
    unit: "Meter",
    latLong: "30.0°S, 19.0°E",
    projection: "Transverse Mercator",
    datum: "Hartebeesthoek94",
    verticalDatum: "Land Levelling Datum",
    horizontalComponent: "Hartebeesthoek94 / Lo19",
    verticalComponent: "Land Levelling Datum height",
    horizontalCode: "2046",
    verticalCode: "5707"
  }
];