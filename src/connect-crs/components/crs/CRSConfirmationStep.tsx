// @ts-nocheck
import React from 'react';
import { Globe, AlertTriangle, Pencil } from 'lucide-react';

interface LocalSiteSettings {
  projectLatitude: string;
  projectLongitude: string;
  projectHeight: string;
  groundScaleFactor: string;
  northingOffset: string;
  eastingOffset: string;
}

interface SiteCalibrationSettings {
  horizontalAdjustment: string;
  verticalAdjustment: string;
}

interface CRSInfo {
  horizontalName?: string;
  horizontalCode?: string;
  verticalName?: string;
  verticalCode?: string;
  hasLocalSite?: boolean;
  hasCalibration?: boolean;
  localSite?: LocalSiteSettings;
  calibration?: SiteCalibrationSettings;
}

interface Impact {
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

interface CRSConfirmationStepProps {
  previousCRS: CRSInfo | null;
  newCRS: CRSInfo;
  impacts?: Impact[];
  requiresConfirmation?: boolean;
  isConfirmed?: boolean;
  onConfirmChange?: (confirmed: boolean) => void;
  onEditHorizontal?: () => void;
  onEditVertical?: () => void;
}

const LOCAL_SITE_FIELDS: Array<{ key: keyof LocalSiteSettings; label: string }> = [
  { key: 'projectLatitude', label: 'Project Latitude' },
  { key: 'projectLongitude', label: 'Project Longitude' },
  { key: 'projectHeight', label: 'Project Height' },
  { key: 'groundScaleFactor', label: 'Ground Scale Factor' },
];

const CALIBRATION_FIELDS: Array<{ key: keyof SiteCalibrationSettings; label: string }> = [
  { key: 'horizontalAdjustment', label: 'Horizontal Adjustment' },
  { key: 'verticalAdjustment', label: 'Vertical Adjustment' },
];

const getChangedLocalSiteKeys = (
  previousLocalSite: LocalSiteSettings | undefined,
  nextLocalSite: LocalSiteSettings | undefined
) =>
  LOCAL_SITE_FIELDS
    .filter(({ key }) => {
      const next = nextLocalSite?.[key];
      if (!next || next.trim() === '') return false;
      return next !== previousLocalSite?.[key];
    })
    .map(({ key }) => key);

const getChangedCalibrationKeys = (
  previousCalibration: SiteCalibrationSettings | undefined,
  nextCalibration: SiteCalibrationSettings | undefined
) =>
  CALIBRATION_FIELDS
    .filter(({ key }) => {
      const next = nextCalibration?.[key];
      if (!next || next.trim() === '') return false;
      return next !== previousCalibration?.[key];
    })
    .map(({ key }) => key);

const FieldRows = <T extends Record<string, string>>({
  values,
  fields,
  includeKeys,
}: {
  values: T | undefined;
  fields: Array<{ key: keyof T; label: string }>;
  includeKeys: Array<keyof T>;
}) => {
  if (includeKeys.length === 0) {
    return <div className="text-[13px] text-[#aeaeb6] italic">Not configured</div>;
  }
  const visible = fields.filter((field) => includeKeys.includes(field.key));
  return (
    <div className="space-y-1.5 text-[12px]">
      {visible.map((field) => {
        const value = values?.[field.key];
        const hasValue = typeof value === 'string' && value.trim() !== '';
        return (
          <div key={String(field.key)} className="flex justify-between">
            <span className="text-[#6a6976]">{field.label}:</span>
            <span className={hasValue ? 'text-[#363545] font-medium' : 'text-[#aeaeb6] italic'}>
              {hasValue ? value : 'Not configured'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * CRSConfirmationStep displays a side-by-side comparison of Previous vs New CRS configuration.
 * Used in the final confirmation step before applying CRS changes.
 */
const CRSConfirmationStep: React.FC<CRSConfirmationStepProps> = ({
  previousCRS,
  newCRS,
  impacts = [],
  requiresConfirmation = false,
  isConfirmed = false,
  onConfirmChange,
  onEditHorizontal,
  onEditVertical
}) => {
  const hasPreviousCRS = previousCRS && (previousCRS.horizontalName || previousCRS.verticalName);
  const showLocalSite = !!(previousCRS?.localSite || newCRS.localSite);
  const showCalibration = !!(previousCRS?.calibration || newCRS.calibration);
  const changedLocalSiteKeys = getChangedLocalSiteKeys(previousCRS?.localSite, newCRS.localSite);
  const changedCalibrationKeys = getChangedCalibrationKeys(previousCRS?.calibration, newCRS.calibration);

  return (
    <div className="p-6">
      <h3 className="text-[16px] font-bold text-[#363545] mb-6">Confirm Configuration</h3>

      {/* Side-by-side comparison cards */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Previous CRS Card */}
        <div className="bg-[#f3f3f7] border border-[#d0d0d7] rounded-[4px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-[#6a6976]" />
            <span className="text-[14px] font-bold text-[#6a6976]">Previous</span>
          </div>
          
          {hasPreviousCRS ? (
            <div className="space-y-3">
              {/* Horizontal */}
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6a6976] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-[12px] font-semibold text-[#6a6976]">Horizontal CRS</div>
                  <div className="text-[13px] text-[#363545]">
                    {previousCRS.horizontalName || 'Not defined'}
                  </div>
                </div>
              </div>
              
              {/* Vertical */}
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6a6976] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-[12px] font-semibold text-[#6a6976]">Vertical CRS</div>
                  <div className="text-[13px] text-[#363545]">
                    {previousCRS.verticalName || 'Not defined'}
                  </div>
                </div>
              </div>

              {/* Local Site Settings */}
              {showLocalSite && (
                <div className="mt-4 pt-4 border-t border-[#d0d0d7]">
                  <div className="text-[12px] font-semibold text-[#6a6976] mb-2">Local Site Settings</div>
                  <FieldRows
                    values={previousCRS.localSite}
                    fields={LOCAL_SITE_FIELDS}
                    includeKeys={changedLocalSiteKeys}
                  />
                </div>
              )}

              {/* Site Calibration */}
              {showCalibration && (
                <div className="mt-4 pt-4 border-t border-[#d0d0d7]">
                  <div className="text-[12px] font-semibold text-[#6a6976] mb-2">Site Calibration</div>
                  <FieldRows
                    values={previousCRS.calibration}
                    fields={CALIBRATION_FIELDS}
                    includeKeys={changedCalibrationKeys}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-[13px] text-[#aeaeb6] italic">
              No coordinate reference system defined.
            </div>
          )}
        </div>

        {/* New CRS Card - Green highlighted border */}
        <div className="bg-white border-2 border-[#5e9331] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-[#363545]" />
            <span className="text-[14px] font-bold text-[#363545]">New CRS</span>
          </div>
          
          <div className="space-y-3">
            {/* Horizontal */}
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f5c518] mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12px] font-semibold text-[#363545]">Horizontal CRS</div>
                  {onEditHorizontal && (
                    <button
                      onClick={onEditHorizontal}
                      className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                      title="Edit Horizontal CRS"
                      aria-label="Edit Horizontal CRS"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-[13px] text-[#363545]">
                  {newCRS.horizontalName || 'Not defined'}
                </div>
              </div>
            </div>
            
            {/* Vertical */}
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#e88c30] mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12px] font-semibold text-[#363545]">Vertical CRS</div>
                  {onEditVertical && (
                    <button
                      onClick={onEditVertical}
                      className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                      title="Edit Vertical CRS"
                      aria-label="Edit Vertical CRS"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-[13px] text-[#363545]">
                  {newCRS.verticalName || 'Not defined'}
                </div>
              </div>
            </div>

            {/* Local Site Settings */}
            {showLocalSite && (
              <div className="mt-4 pt-4 border-t border-[#d0d0d7]">
                <div className="text-[12px] font-semibold text-[#363545] mb-2">Local Site Settings</div>
                <FieldRows
                  values={newCRS.localSite}
                  fields={LOCAL_SITE_FIELDS}
                  includeKeys={changedLocalSiteKeys}
                />
              </div>
            )}

            {/* Site Calibration */}
            {showCalibration && (
              <div className="mt-4 pt-4 border-t border-[#d0d0d7]">
                <div className="text-[12px] font-semibold text-[#363545] mb-2">Site Calibration</div>
                <FieldRows
                  values={newCRS.calibration}
                  fields={CALIBRATION_FIELDS}
                  includeKeys={changedCalibrationKeys}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Potential Impact Section */}
      <div className="mb-6">
        <h4 className="text-[14px] font-bold text-[#363545] mb-3">Potential impact</h4>
        
        {impacts.length > 0 ? (
          <ul className="space-y-2">
            {impacts.map((impact, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[13px]">
                <AlertTriangle 
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    impact.severity === 'critical' ? 'text-[#a51d25]' :
                    impact.severity === 'warning' ? 'text-[#bf7806]' :
                    'text-[#6a6976]'
                  }`} 
                />
                <span className="text-[#6a6976]">{impact.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-[#6a6976]">
            {hasPreviousCRS 
              ? 'This change affects fundamental coordinate parameters.' 
              : 'This is a new CRS configuration for the project.'}
          </p>
        )}
      </div>

      {/* Confirmation Checkbox */}
      {requiresConfirmation && (
        <label className="flex items-start gap-3 p-4 bg-[#f9f9fb] border border-[#d0d0d7] rounded-[4px] cursor-pointer hover:bg-[#f3f3f7] transition-colors">
          <input 
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => onConfirmChange?.(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-[#005f9e] flex-shrink-0"
          />
          <span className="text-[13px] text-[#363545] leading-relaxed">
            I understand these impacts and have consulted with project stakeholders and technical team members before proceeding.
          </span>
        </label>
      )}
    </div>
  );
};

export default CRSConfirmationStep;
