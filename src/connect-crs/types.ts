import type { LucideIcon } from "lucide-react";

export const FileType = {
  FOLDER: 'FOLDER',
  FILE: 'FILE',
  IMAGE: 'IMAGE',
  MODEL: 'MODEL',
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  type: FileType;
  size?: string;
  modifiedBy: string;
  modifiedOn: string;
  version: number;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  isHeader?: boolean;
  children?: MenuItem[];
  isBackLink?: boolean;
}

export type SelectionState = Set<string>;

export type ViewType = 
  | 'explorer' 
  | 'views'
  | 'releases'
  | 'project-details' 
  | 'activity' 
  | 'bcf' 
  | 'team'
  | 'shared-model'
  | 'todo'
  | 'property-libraries'
  | 'permissions-overview'
  | 'settings-bcf'
  | 'extensions'
  | 'notifications'
  | 'units'
  | 'tags'
  | 'permissions'
  | 'sync';

export interface LocalSiteSettings {
  projectLatitude: string;
  projectLongitude: string;
  projectHeight: string;
  groundScaleFactor: string;
  northingOffset: string;
  eastingOffset: string;
}

export interface SiteCalibrationSettings {
  horizontalAdjustment: string;
  verticalAdjustment: string;
}

export interface CRSItem {
  code: string;
  name: string;
  area: string;
  type: string;
  unit: string;
  latLong: string;
  // Detailed fields
  projection?: string;
  datum?: string;
  verticalDatum?: string;
  geoid?: string;
  horizontalComponent?: string;
  verticalComponent?: string;
  horizontalCode?: string;
  verticalCode?: string;
  // Local Site & Calibration
  localSite?: LocalSiteSettings;
  calibration?: SiteCalibrationSettings;
}