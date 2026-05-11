// @ts-nocheck
import React, { useState } from 'react';
import { Map, Settings, Plus, Pencil, Trash2, HelpCircle, Info, AlertCircle } from "lucide-react";
import type { CRSItem } from '../../types';
import { formatLatForDisplay, formatLongForDisplay } from '../../utils/geoUtils';
import LocalSiteSettingsDialog from '../dialogs/LocalSiteSettingsDialog';
import SiteCalibrationDialog from '../dialogs/SiteCalibrationDialog';

// Tooltip component for inline help
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-flex">
      <div 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#363545] text-white text-[12px] rounded-[4px] shadow-lg z-50 leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#363545]"></div>
        </div>
      )}
    </div>
  );
};

export interface SiteParametersState {
  enableLocalSite: boolean;
  enableSiteCalibration: boolean;
  lsLat: string;
  lsLng: string;
  lsHeight: string;
  lsScale: string;
  lsNorthing: string;
  lsEasting: string;
  calHz: string;
  calVt: string;
}

interface ConfigureSiteParametersProps {
  baselineCRS: {
    horizontalName: string;
    horizontalCode: string | undefined;
    verticalName: string;
    verticalCode: string | undefined;
    unit: string;
    type: 'compound' | 'combine';
  };
  values: SiteParametersState;
  onChange: (updates: Partial<SiteParametersState>) => void;
  unitLabel: string;
}

// Tooltips for field explanations
const FIELD_TOOLTIPS: Record<string, string> = {
  'Latitude': 'The geographic latitude of your project reference point. Used to calculate grid-to-ground transformations.',
  'Longitude': 'The geographic longitude of your project reference point. Used with latitude to define the local site origin.',
  'Height': 'The ellipsoidal or orthometric height at the project reference point. Affects scale factor calculations.',
  'Scale Factor': 'The combined scale factor at the project site. Values close to 1.0 indicate minimal distortion. Typical range: 0.9999 to 1.0001.',
  'Horizontal Adjustment': 'Horizontal shift applied to align the coordinate system with local control points.',
  'Vertical Adjustment': 'Vertical shift applied to match local elevation benchmarks.'
};

// Helper to show a readonly field value with optional tooltip
const ReadOnlyField = ({ label, value, showTooltip = true }: { label: string, value: string, showTooltip?: boolean }) => (
  <div>
    <div className="text-[11px] text-[#6a6976] uppercase tracking-wide mb-0.5 flex items-center gap-1">
      {label}
      {showTooltip && FIELD_TOOLTIPS[label] && (
        <Tooltip text={FIELD_TOOLTIPS[label]}>
          <Info className="w-3.5 h-3.5 text-[#aeaeb6] hover:text-[#005f9e] transition-colors" />
        </Tooltip>
      )}
    </div>
    <div className="text-[13px] text-[#363545] font-medium truncate" title={value}>{value}</div>
  </div>
);

const ConfigureSiteParameters: React.FC<ConfigureSiteParametersProps> = ({
  baselineCRS,
  values,
  onChange,
  unitLabel
}) => {
  const [showLocalSiteDialog, setShowLocalSiteDialog] = useState(false);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);

  return (
    <div className="flex flex-col flex-1 w-full h-full bg-white overflow-hidden">
      
      {/* Summary of Baseline - Fixed at top */}
      <div className="bg-[#f9f9fb] border-b border-[#d0d0d7] p-6 flex-shrink-0 z-10 shadow-sm">
          <h3 className="text-[14px] font-bold text-[#363545] mb-4">Baseline Coordinate System</h3>
          <div className="flex gap-8 items-start">
            <div>
                <div className="text-[12px] text-[#6a6976] uppercase tracking-wider font-semibold mb-1">Horizontal Component</div>
                <div className="text-[14px] text-[#363545] truncate max-w-md">
                    {baselineCRS.horizontalName} <span className="text-[#d0d0d7] mx-1">|</span> <span className="text-[#6a6976] text-[13px]">Unit: {baselineCRS.unit}</span>
                </div>
            </div>
            
            <Plus className="w-5 h-5 text-[#aeaeb6] mt-4 flex-shrink-0" />
            
            <div>
                <div className="text-[12px] text-[#6a6976] uppercase tracking-wider font-semibold mb-1">Vertical Component</div>
                <div className="text-[14px] text-[#363545] truncate max-w-md">
                    {baselineCRS.verticalName} <span className="text-[#d0d0d7] mx-1">|</span> <span className="text-[#6a6976] text-[13px]">Unit: {baselineCRS.unit}</span>
                </div>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 min-h-0">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
              <div>
                  <h3 className="text-[18px] font-bold text-[#363545] mb-2">Configure Site Parameters</h3>
                  <p className="text-[14px] text-[#6a6976]">Optionally apply local site settings and site calibration adjustments to your baseline coordinate system.</p>
              </div>

              {/* Decision Helper Box */}
              <div className="bg-[#f0f7ff] border border-[#bdd8f3] rounded-[4px] p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#005f9e] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[14px] font-bold text-[#363545] mb-2">Do you need site adjustments?</h4>
                    <p className="text-[13px] text-[#6a6976] mb-3">
                      Most standard surveying projects don't require these settings. Only add them if your surveyor has provided specific values.
                    </p>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#005f9e] mt-2 flex-shrink-0"></div>
                        <span className="text-[#363545]">
                          <strong>Local Site Settings:</strong> Use when you need to match grid coordinates to ground measurements (scale factor, project height, etc.).
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#005f9e] mt-2 flex-shrink-0"></div>
                        <span className="text-[#363545]">
                          <strong>Site Calibration:</strong> Use when you have transformation parameters from control point measurements.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* Local Site Card */}
                {!values.enableLocalSite ? (
                  <button 
                    onClick={() => setShowLocalSiteDialog(true)}
                    className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#d0d0d7] rounded-[4px] bg-[#f9f9fb] hover:bg-white hover:border-[#005f9e] hover:shadow-md transition-all h-[320px] cursor-pointer text-left"
                  >
                     <div className="w-16 h-16 rounded-full bg-white border border-[#d0d0d7] flex items-center justify-center mb-4 group-hover:border-[#005f9e] transition-colors">
                        <Map className="w-8 h-8 text-[#aeaeb6] group-hover:text-[#005f9e] transition-colors" strokeWidth={1.5} />
                     </div>
                     <h4 className="text-[16px] font-bold text-[#363545] mb-2 group-hover:text-[#005f9e] transition-colors">Local Site Settings</h4>
                     <p className="text-[13px] text-[#6a6976] text-center max-w-[280px] mb-3">
                       Define scale factor and project height to align the grid with ground coordinates.
                     </p>
                     <p className="text-[12px] text-[#aeaeb6] text-center max-w-[280px] mb-4 italic">
                       Use when: Your surveyor has provided grid-to-ground parameters
                     </p>
                     <div className="px-4 py-2 rounded-[2px] bg-white border border-[#d0d0d7] text-[#005f9e] text-[13px] font-bold group-hover:bg-[#005f9e] group-hover:text-white group-hover:border-[#005f9e] transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Settings
                     </div>
                  </button>
                ) : (
                  <div className="flex flex-col border border-[#005f9e] rounded-[4px] bg-white shadow-sm h-[320px] relative overflow-hidden ring-1 ring-[#005f9e]/10">
                     <div className="absolute top-0 inset-x-0 h-1 bg-[#005f9e]"></div>
                     
                     <div className="p-5 flex items-start justify-between border-b border-[#f3f3f7]">
                        <div className="flex items-center gap-3">
                           <div className="p-2.5 rounded-full bg-[#e5f0f8] text-[#005f9e]">
                              <Map className="w-5 h-5" />
                           </div>
                           <div>
                             <h4 className="text-[15px] font-bold text-[#363545]">Local Site Settings</h4>
                             <div className="text-[12px] text-[#5e9331] font-medium flex items-center gap-1 mt-0.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#5e9331]"></div> Active
                             </div>
                           </div>
                        </div>
                        <button 
                           onClick={() => onChange({ enableLocalSite: false })}
                           className="text-[#6a6976] hover:text-[#a51d25] p-1.5 hover:bg-[#a51d25]/5 rounded-[2px] transition-colors"
                           title="Remove Settings"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="flex-1 p-5 overflow-y-auto bg-white/50">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                           <ReadOnlyField label="Latitude" value={formatLatForDisplay(values.lsLat)} />
                           <ReadOnlyField label="Longitude" value={formatLongForDisplay(values.lsLng)} />
                           <ReadOnlyField label="Height" value={`${values.lsHeight} ${unitLabel}`} />
                           <ReadOnlyField label="Scale Factor" value={values.lsScale} />
                        </div>
                     </div>
                     
                     <div className="p-4 border-t border-[#f3f3f7] bg-[#f9f9fb]">
                        <button 
                           onClick={() => setShowLocalSiteDialog(true)}
                           className="w-full py-2 bg-white border border-[#d0d0d7] rounded-[2px] text-[13px] font-bold text-[#363545] hover:bg-white hover:border-[#005f9e] hover:text-[#005f9e] transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                           <Pencil className="w-4 h-4" /> Edit Parameters
                        </button>
                     </div>
                  </div>
                )}

                {/* Site Calibration Card */}
                {!values.enableSiteCalibration ? (
                  <button 
                    onClick={() => setShowCalibrationDialog(true)}
                    className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#d0d0d7] rounded-[4px] bg-[#f9f9fb] hover:bg-white hover:border-[#005f9e] hover:shadow-md transition-all h-[320px] cursor-pointer text-left"
                  >
                     <div className="w-16 h-16 rounded-full bg-white border border-[#d0d0d7] flex items-center justify-center mb-4 group-hover:border-[#005f9e] transition-colors">
                        <Settings className="w-8 h-8 text-[#aeaeb6] group-hover:text-[#005f9e] transition-colors" strokeWidth={1.5} />
                     </div>
                     <h4 className="text-[16px] font-bold text-[#363545] mb-2 group-hover:text-[#005f9e] transition-colors">Site Calibration</h4>
                     <p className="text-[13px] text-[#6a6976] text-center max-w-[280px] mb-3">
                       Apply transformation parameters (horizontal and vertical adjustments) to match local control points.
                     </p>
                     <p className="text-[12px] text-[#aeaeb6] text-center max-w-[280px] mb-4 italic">
                       Use when: You have calibration data from control point measurements
                     </p>
                     <div className="px-4 py-2 rounded-[2px] bg-white border border-[#d0d0d7] text-[#005f9e] text-[13px] font-bold group-hover:bg-[#005f9e] group-hover:text-white group-hover:border-[#005f9e] transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Calibration
                     </div>
                  </button>
                ) : (
                  <div className="flex flex-col border border-[#005f9e] rounded-[4px] bg-white shadow-sm h-[320px] relative overflow-hidden ring-1 ring-[#005f9e]/10">
                     <div className="absolute top-0 inset-x-0 h-1 bg-[#005f9e]"></div>
                     
                     <div className="p-5 flex items-start justify-between border-b border-[#f3f3f7]">
                        <div className="flex items-center gap-3">
                           <div className="p-2.5 rounded-full bg-[#e5f0f8] text-[#005f9e]">
                              <Settings className="w-5 h-5" />
                           </div>
                           <div>
                             <h4 className="text-[15px] font-bold text-[#363545]">Site Calibration</h4>
                             <div className="text-[12px] text-[#5e9331] font-medium flex items-center gap-1 mt-0.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#5e9331]"></div> Active
                             </div>
                           </div>
                        </div>
                        <button 
                           onClick={() => onChange({ enableSiteCalibration: false })}
                           className="text-[#6a6976] hover:text-[#a51d25] p-1.5 hover:bg-[#a51d25]/5 rounded-[2px] transition-colors"
                           title="Remove Calibration"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="flex-1 p-5 overflow-y-auto bg-white/50">
                        <div className="grid grid-cols-1 gap-y-4 gap-x-8">
                             <ReadOnlyField label="Horizontal Adjustment" value={`${values.calHz} ${unitLabel}`} />
                             <ReadOnlyField label="Vertical Adjustment" value={`${values.calVt} ${unitLabel}`} />
                        </div>
                     </div>
                     
                     <div className="p-4 border-t border-[#f3f3f7] bg-[#f9f9fb]">
                        <button 
                           onClick={() => setShowCalibrationDialog(true)}
                           className="w-full py-2 bg-white border border-[#d0d0d7] rounded-[2px] text-[13px] font-bold text-[#363545] hover:bg-white hover:border-[#005f9e] hover:text-[#005f9e] transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                           <Pencil className="w-4 h-4" /> Edit Parameters
                        </button>
                     </div>
                  </div>
                )}

              </div>
          </div>
      </div>

      {/* Dialogs */}
      <LocalSiteSettingsDialog 
        isOpen={showLocalSiteDialog}
        onClose={() => setShowLocalSiteDialog(false)}
        onConfirm={(newValues) => {
            onChange({ ...newValues, enableLocalSite: true });
            setShowLocalSiteDialog(false);
        }}
        initialValues={{
            lsLat: values.lsLat,
            lsLng: values.lsLng,
            lsHeight: values.lsHeight,
            lsScale: values.lsScale,
            lsNorthing: values.lsNorthing,
            lsEasting: values.lsEasting
        }}
        unitLabel={unitLabel}
      />

      <SiteCalibrationDialog
        isOpen={showCalibrationDialog}
        onClose={() => setShowCalibrationDialog(false)}
        onConfirm={(newValues) => {
            onChange({ ...newValues, enableSiteCalibration: true });
            setShowCalibrationDialog(false);
        }}
        initialValues={{
            calHz: values.calHz,
            calVt: values.calVt
        }}
        unitLabel={unitLabel}
      />

    </div>
  );
};

export default ConfigureSiteParameters;