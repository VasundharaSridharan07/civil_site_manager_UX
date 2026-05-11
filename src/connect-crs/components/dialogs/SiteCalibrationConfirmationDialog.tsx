// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Globe, X } from 'lucide-react';
import type { LocalSiteSettings, SiteCalibrationSettings } from '../../types';

interface CRSIdentity {
  horizontalName: string;
  verticalName: string;
}

interface SiteCalibrationConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onApply: () => void;
  previousCRS: CRSIdentity;
  newCRS: CRSIdentity;
  previousCalibration?: SiteCalibrationSettings;
  newCalibration: Partial<SiteCalibrationSettings>;
  previousLocalSite?: LocalSiteSettings;
  newLocalSite?: LocalSiteSettings;
}

const IMPACTS = [
  'Horizontal and vertical positions may shift when transformed in project workflows.',
  'Survey outputs based on previous calibration values may no longer align with updated results.',
  'Coordinate consistency across teams depends on everyone using the same calibration parameters.',
  'Existing deliverables may need verification or reprocessing after calibration updates.'
];

const LOCAL_SITE_FIELD_LABELS: Array<{ key: keyof LocalSiteSettings; label: string }> = [
  { key: 'projectLatitude', label: 'Latitude' },
  { key: 'projectLongitude', label: 'Longitude' },
  { key: 'projectHeight', label: 'Project Height' },
  { key: 'groundScaleFactor', label: 'Ground Scale Factor' },
];
const DEFAULT_LOCAL_SITE_VALUES = {
  projectLatitude: '0.0000° N',
  projectLongitude: '0.0000° W',
  projectHeight: '0.000',
  groundScaleFactor: '1.00000',
} as const;

const CalibrationValues: React.FC<{
  values?: Partial<SiteCalibrationSettings>;
  includeKeys: Array<keyof SiteCalibrationSettings>;
}> = ({ values, includeKeys }) => {
  if (includeKeys.length === 0) {
    return <p className="text-[13px] text-[#aeaeb6] italic">Not configured</p>;
  }

  const allFields: Array<{ key: keyof SiteCalibrationSettings; label: string }> = [
    { label: 'Horizontal Adjustment', key: 'horizontalAdjustment' },
    { label: 'Vertical Adjustment', key: 'verticalAdjustment' }
  ];
  const fields = allFields.filter(field => includeKeys.includes(field.key));

  return (
    <div className="space-y-1.5 text-[12px]">
      {fields.map((field) => {
        const value = values?.[field.key];
        const hasValue = typeof value === 'string' && value.trim() !== '';
        return (
        <div key={field.key} className="flex justify-between">
          <span className="text-[#6a6976]">{field.label}:</span>
          <span className={hasValue ? 'text-[#363545] font-medium' : 'text-[#aeaeb6] italic'}>
            {hasValue ? value : 'Not configured'}
          </span>
        </div>
      );})}
    </div>
  );
};

const LocalSiteValues: React.FC<{
  values?: Partial<LocalSiteSettings>;
  includeKeys: Array<keyof LocalSiteSettings>;
}> = ({ values, includeKeys }) => {
  if (includeKeys.length === 0) {
    return <p className="text-[13px] text-[#aeaeb6] italic">Not configured</p>;
  }
  const fields = LOCAL_SITE_FIELD_LABELS.filter(field => includeKeys.includes(field.key));
  return (
    <div className="space-y-1.5 text-[12px]">
      {fields.map((field) => {
        const value = values?.[field.key];
        const hasValue = typeof value === 'string' && value.trim() !== '';
        return (
          <div key={field.key} className="flex justify-between">
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

const SiteCalibrationConfirmationDialog: React.FC<SiteCalibrationConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onBack,
  onApply,
  previousCRS,
  newCRS,
  previousCalibration,
  newCalibration,
  previousLocalSite,
  newLocalSite
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
  const stripUnit = (value: string) => value.replace(/\s*(m|sft|ft)$/i, '').trim();
  const changedCalibrationKeys = ([
    'horizontalAdjustment',
    'verticalAdjustment'
  ] as Array<keyof SiteCalibrationSettings>).filter((key) => {
    const value = newCalibration[key];
    return typeof value === 'string' && value.trim() !== '';
  });
  const localSiteContextKeys = ([
    'projectLatitude',
    'projectLongitude',
    'projectHeight',
    'groundScaleFactor',
  ] as Array<keyof LocalSiteSettings>).filter((key) => {
    const prev = previousLocalSite?.[key];
    const next = newLocalSite?.[key];
    const compareValue = (value: string | undefined) => {
      if (!value || value.trim() === '') return false;
      if (key === 'projectHeight') {
        return stripUnit(value) !== DEFAULT_LOCAL_SITE_VALUES[key];
      }
      return normalize(value) !== DEFAULT_LOCAL_SITE_VALUES[key];
    };
    return compareValue(prev) || compareValue(next);
  });

  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
    }
  }, [isOpen]);

  const impactSeverity = useMemo(() => {
    const hasPrevious = !!previousCalibration;
    return hasPrevious ? 'warning' : 'info';
  }, [previousCalibration]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-full max-w-[64rem] max-h-[90vh] bg-white shadow-xl rounded-[2px] overflow-hidden">
        <header className="flex items-center justify-between px-6 py-5 border-b border-[#d0d0d7]">
          <h2 className="text-[18px] font-bold text-[#363545]">Configure coordinate reference system</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black" aria-label="Close confirmation dialog">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-[16px] font-bold text-[#363545] mb-6">Confirm Configuration</h3>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="bg-[#f3f3f7] border border-[#d0d0d7] rounded-[4px] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-[#6a6976]" />
                <span className="text-[14px] font-bold text-[#6a6976]">Previous</span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#6a6976] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#6a6976]">Horizontal CRS</div>
                    <div className="text-[13px] text-[#363545]">{previousCRS.horizontalName}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#6a6976] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#6a6976]">Vertical CRS</div>
                    <div className="text-[13px] text-[#363545]">{previousCRS.verticalName}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#d0d0d7]">
                <div className="text-[12px] font-semibold text-[#6a6976] mb-2">Local Site Settings</div>
                <LocalSiteValues values={previousLocalSite} includeKeys={localSiteContextKeys} />
              </div>
              <div className="mt-4 pt-4 border-t border-[#d0d0d7]">
                <div className="text-[12px] font-semibold text-[#6a6976] mb-2">Site Calibration</div>
                <CalibrationValues values={previousCalibration} includeKeys={changedCalibrationKeys} />
              </div>
            </div>

            <div className="bg-white border-2 border-[#5e9331] rounded-[4px] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-[#363545]" />
                <span className="text-[14px] font-bold text-[#363545]">New CRS</span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#f5c518] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#363545]">Horizontal CRS</div>
                    <div className="text-[13px] text-[#363545]">{newCRS.horizontalName}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#e88c30] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#363545]">Vertical CRS</div>
                    <div className="text-[13px] text-[#363545]">{newCRS.verticalName}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#d0d0d7]">
                <div className="text-[12px] font-semibold text-[#363545] mb-2">Local Site Settings</div>
                <LocalSiteValues values={newLocalSite} includeKeys={localSiteContextKeys} />
              </div>
              <div className="mt-4 pt-4 border-t border-[#d0d0d7]">
                <div className="text-[12px] font-semibold text-[#363545] mb-2">Site Calibration</div>
                <CalibrationValues values={newCalibration} includeKeys={changedCalibrationKeys} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-[14px] font-bold text-[#363545] mb-3">Potential impact</h3>
            <ul className="space-y-2">
              {IMPACTS.map((message, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[13px] text-[#6a6976]">
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      impactSeverity === 'warning' ? 'text-[#bf7806]' : 'text-[#6a6976]'
                    }`}
                  />
                  <span>{message}</span>
                </li>
              ))}
            </ul>
          </div>

          <label className="flex items-start gap-3 p-4 bg-[#f9f9fb] border border-[#d0d0d7] rounded-[4px] cursor-pointer hover:bg-[#f3f3f7] transition-colors">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#005f9e] flex-shrink-0"
            />
            <span className="text-[13px] text-[#363545] leading-relaxed">
              I understand these impacts and have consulted with project stakeholders and technical team members before proceeding.
            </span>
          </label>
        </div>

        <footer className="flex justify-end items-center gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onApply}
            disabled={!confirmed}
            className={`text-white text-[14px] font-bold py-2 px-5 rounded-[2px] transition-colors ${
              confirmed ? 'bg-[#005f9e] hover:bg-[#00437b]' : 'bg-[#d0d0d7] cursor-not-allowed'
            }`}
          >
            Apply changes
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SiteCalibrationConfirmationDialog;
