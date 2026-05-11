// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import type { CRSItem, LocalSiteSettings, SiteCalibrationSettings } from '../types';
import { formatLatForDisplay, formatLongForDisplay } from '../utils/geoUtils';
import LocalSiteSettingsDialog from './dialogs/LocalSiteSettingsDialog';
import SiteCalibrationDialog from './dialogs/SiteCalibrationDialog';
import LocalSiteSettingsConfirmationDialog from './dialogs/LocalSiteSettingsConfirmationDialog';
import SiteCalibrationConfirmationDialog from './dialogs/SiteCalibrationConfirmationDialog';

interface CRSDisplayProps {
  hasProjectedCRS: boolean;
  activeCRS: CRSItem | null;
  viewMode: 'summary' | 'detailed';
  onViewModeChange: (mode: 'summary' | 'detailed') => void;
  onShowHelp?: () => void;
  onEditCRS?: () => void;
  onUpdateLocalSite?: (localSite: LocalSiteSettings | undefined) => void;
  onUpdateCalibration?: (calibration: SiteCalibrationSettings | undefined) => void;
}

const CRSDisplay: React.FC<CRSDisplayProps> = ({ 
  hasProjectedCRS, 
  activeCRS, 
  viewMode, 
  onViewModeChange, 
  onShowHelp,
  onEditCRS,
  onUpdateLocalSite,
  onUpdateCalibration 
}) => {
  const DEFAULT_LOCAL_SITE_VALUES = {
    latitude: '0.0000° N',
    longitude: '0.0000° W',
    height: '0.000',
    scaleFactor: '1.00000',
    northingOffset: '0.000',
    eastingOffset: '0.000'
  };
  const DEFAULT_CALIBRATION_VALUES = {
    horizontal: '0.000',
    vertical: '0.000'
  };

  type LocalSiteFormValues = {
    lsLat: string;
    lsLng: string;
    lsHeight: string;
    lsScale: string;
    lsNorthing: string;
    lsEasting: string;
  };
  type CalibrationFormValues = {
    calHz: string;
    calVt: string;
  };

  const [showLocalSiteDialog, setShowLocalSiteDialog] = useState(false);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [showLocalSiteConfirmDialog, setShowLocalSiteConfirmDialog] = useState(false);
  const [pendingLocalSiteUpdate, setPendingLocalSiteUpdate] = useState<LocalSiteSettings | null>(null);
  const [pendingLocalSiteChanges, setPendingLocalSiteChanges] = useState<Partial<LocalSiteSettings> | null>(null);
  const [pendingLocalSitePrevious, setPendingLocalSitePrevious] = useState<LocalSiteSettings | undefined>(undefined);
  const [localSiteDraftValues, setLocalSiteDraftValues] = useState<LocalSiteFormValues | null>(null);
  const [showCalibrationConfirmDialog, setShowCalibrationConfirmDialog] = useState(false);
  const [pendingCalibrationUpdate, setPendingCalibrationUpdate] = useState<SiteCalibrationSettings | null>(null);
  const [pendingCalibrationChanges, setPendingCalibrationChanges] = useState<Partial<SiteCalibrationSettings> | null>(null);
  const [pendingCalibrationPrevious, setPendingCalibrationPrevious] = useState<SiteCalibrationSettings | undefined>(undefined);
  const [calibrationDraftValues, setCalibrationDraftValues] = useState<CalibrationFormValues | null>(null);

  // Determine unit label from CRS
  const unitLabel = useMemo(() => {
    if (!activeCRS) return 'm';
    const u = activeCRS.unit;
    if (!u || u === 'Not defined') return 'm';
    if (u === 'Meter') return 'm';
    if (u === 'U.S. Survey Feet') return 'sft';
    if (u.includes('Feet')) return 'ft';
    return u.substring(0, 3).toLowerCase();
  }, [activeCRS]);

  // Parse local site values from display format
  const parseLocalSiteValues = () => {
    if (!activeCRS?.localSite) {
      return {
        lsLat: "0.0000° N",
        lsLng: "0.0000° W",
        lsHeight: "0.000",
        lsScale: "1.00000",
        lsNorthing: "0.000",
        lsEasting: "0.000"
      };
    }
    const ls = activeCRS.localSite;
    // Strip unit suffixes from values
    const stripUnit = (val: string) => val.replace(/\s*(m|sft|ft)$/i, '').trim();
    return {
      lsLat: ls.projectLatitude,
      lsLng: ls.projectLongitude,
      lsHeight: stripUnit(ls.projectHeight),
      lsScale: ls.groundScaleFactor,
      lsNorthing: stripUnit(ls.northingOffset),
      lsEasting: stripUnit(ls.eastingOffset)
    };
  };

  // Parse calibration values
  const parseCalibrationValues = () => {
    if (!activeCRS?.calibration) {
      return { calHz: "0.000", calVt: "0.000" };
    }
    const cal = activeCRS.calibration;
    const stripUnit = (val: string) => val.replace(/\s*(m|sft|ft)$/i, '').trim();
    return {
      calHz: stripUnit(cal.horizontalAdjustment),
      calVt: stripUnit(cal.verticalAdjustment)
    };
  };

  // Handle local site update
  const formatLocalSiteValues = (values: LocalSiteFormValues): LocalSiteSettings => ({
    projectLatitude: values.lsLat,
    projectLongitude: values.lsLng,
    projectHeight: `${values.lsHeight} ${unitLabel}`,
    groundScaleFactor: values.lsScale,
    northingOffset: `${values.lsNorthing} ${unitLabel}`,
    eastingOffset: `${values.lsEasting} ${unitLabel}`
  });

  const normalizeFieldValue = (value: string) => value.trim().replace(/\s+/g, ' ');
  const stripUnit = (value: string) => value.replace(/\s*(m|sft|ft)$/i, '').trim();

  const hasLocalSiteChanges = (previous: LocalSiteFormValues, next: LocalSiteFormValues) =>
    (Object.keys(previous) as Array<keyof LocalSiteFormValues>).some(
      key => normalizeFieldValue(previous[key]) !== normalizeFieldValue(next[key])
    );

  const buildLocalSiteChanges = (previous: LocalSiteFormValues, next: LocalSiteFormValues): Partial<LocalSiteSettings> => {
    const changes: Partial<LocalSiteSettings> = {};
    if (normalizeFieldValue(previous.lsLat) !== normalizeFieldValue(next.lsLat)) {
      changes.projectLatitude = next.lsLat;
    }
    if (normalizeFieldValue(previous.lsLng) !== normalizeFieldValue(next.lsLng)) {
      changes.projectLongitude = next.lsLng;
    }
    if (normalizeFieldValue(previous.lsHeight) !== normalizeFieldValue(next.lsHeight)) {
      changes.projectHeight = `${next.lsHeight} ${unitLabel}`;
    }
    if (normalizeFieldValue(previous.lsScale) !== normalizeFieldValue(next.lsScale)) {
      changes.groundScaleFactor = next.lsScale;
    }
    return changes;
  };

  const handleLocalSiteUpdate = (values: LocalSiteFormValues) => {
    const previousValues = parseLocalSiteValues();
    if (!hasLocalSiteChanges(previousValues, values)) {
      setLocalSiteDraftValues(null);
      setShowLocalSiteDialog(false);
      return;
    }

    setPendingLocalSitePrevious(activeCRS?.localSite);
    setPendingLocalSiteUpdate(formatLocalSiteValues(values));
    setPendingLocalSiteChanges(buildLocalSiteChanges(previousValues, values));
    setLocalSiteDraftValues(values);
    setShowLocalSiteDialog(false);
    setShowLocalSiteConfirmDialog(true);
  };

  const handleApplyLocalSiteUpdate = () => {
    if (pendingLocalSiteUpdate && onUpdateLocalSite) {
      onUpdateLocalSite(pendingLocalSiteUpdate);
    }

    setShowLocalSiteConfirmDialog(false);
    setPendingLocalSiteUpdate(null);
    setPendingLocalSiteChanges(null);
    setPendingLocalSitePrevious(undefined);
    setLocalSiteDraftValues(null);
  };

  const handleCloseLocalSiteConfirmation = () => {
    setShowLocalSiteConfirmDialog(false);
    setPendingLocalSiteUpdate(null);
    setPendingLocalSiteChanges(null);
    setPendingLocalSitePrevious(undefined);
    setLocalSiteDraftValues(null);
  };

  // Handle calibration update
  const formatCalibrationValues = (values: CalibrationFormValues): SiteCalibrationSettings => ({
    horizontalAdjustment: `${values.calHz} ${unitLabel}`,
    verticalAdjustment: `${values.calVt} ${unitLabel}`
  });

  const hasCalibrationChanges = (previous: CalibrationFormValues, next: CalibrationFormValues) =>
    (Object.keys(previous) as Array<keyof CalibrationFormValues>).some(
      key => normalizeFieldValue(previous[key]) !== normalizeFieldValue(next[key])
    );

  const buildCalibrationChanges = (previous: CalibrationFormValues, next: CalibrationFormValues): Partial<SiteCalibrationSettings> => {
    const changes: Partial<SiteCalibrationSettings> = {};
    if (normalizeFieldValue(previous.calHz) !== normalizeFieldValue(next.calHz)) {
      changes.horizontalAdjustment = `${next.calHz} ${unitLabel}`;
    }
    if (normalizeFieldValue(previous.calVt) !== normalizeFieldValue(next.calVt)) {
      changes.verticalAdjustment = `${next.calVt} ${unitLabel}`;
    }
    return changes;
  };

  const handleCalibrationUpdate = (values: CalibrationFormValues) => {
    const previousValues = parseCalibrationValues();
    if (!hasCalibrationChanges(previousValues, values)) {
      setCalibrationDraftValues(null);
      setShowCalibrationDialog(false);
      return;
    }

    setPendingCalibrationPrevious(activeCRS?.calibration);
    setPendingCalibrationUpdate(formatCalibrationValues(values));
    setPendingCalibrationChanges(buildCalibrationChanges(previousValues, values));
    setCalibrationDraftValues(values);
    setShowCalibrationDialog(false);
    setShowCalibrationConfirmDialog(true);
  };

  const handleApplyCalibrationUpdate = () => {
    if (pendingCalibrationUpdate && onUpdateCalibration) {
      onUpdateCalibration(pendingCalibrationUpdate);
    }

    setShowCalibrationConfirmDialog(false);
    setPendingCalibrationUpdate(null);
    setPendingCalibrationChanges(null);
    setPendingCalibrationPrevious(undefined);
    setCalibrationDraftValues(null);
  };

  const handleCloseCalibrationConfirmation = () => {
    setShowCalibrationConfirmDialog(false);
    setPendingCalibrationUpdate(null);
    setPendingCalibrationChanges(null);
    setPendingCalibrationPrevious(undefined);
    setCalibrationDraftValues(null);
  };

  // Check for Tags
  const hasLocalSite = !!activeCRS?.localSite;
  const hasHzCalibration = activeCRS?.calibration && activeCRS.calibration.horizontalAdjustment !== '-';
  const hasVtCalibration = activeCRS?.calibration && activeCRS.calibration.verticalAdjustment !== '-';
  const visibleLocalSiteFields = useMemo(() => {
    if (!activeCRS?.localSite) return [];
    const ls = activeCRS.localSite;
    const fields = [
      { label: 'Latitude', value: ls.projectLatitude, isVisible: normalizeFieldValue(ls.projectLatitude) !== DEFAULT_LOCAL_SITE_VALUES.latitude },
      { label: 'Longitude', value: ls.projectLongitude, isVisible: normalizeFieldValue(ls.projectLongitude) !== DEFAULT_LOCAL_SITE_VALUES.longitude },
      { label: 'Project Height', value: ls.projectHeight, isVisible: stripUnit(ls.projectHeight) !== DEFAULT_LOCAL_SITE_VALUES.height },
      { label: 'Ground Scale Factor', value: ls.groundScaleFactor, isVisible: normalizeFieldValue(ls.groundScaleFactor) !== DEFAULT_LOCAL_SITE_VALUES.scaleFactor },
    ];
    return fields.filter(field => field.isVisible && field.value && field.value.trim() !== '');
  }, [activeCRS]);

  const visibleCalibrationFields = useMemo(() => {
    if (!activeCRS?.calibration) return [];
    const cal = activeCRS.calibration;
    const fields = [
      { label: 'Horizontal Adjustment', value: cal.horizontalAdjustment, isVisible: stripUnit(cal.horizontalAdjustment) !== DEFAULT_CALIBRATION_VALUES.horizontal },
      { label: 'Vertical Adjustment', value: cal.verticalAdjustment, isVisible: stripUnit(cal.verticalAdjustment) !== DEFAULT_CALIBRATION_VALUES.vertical }
    ];
    return fields.filter(field => field.isVisible && field.value && field.value.trim() !== '');
  }, [activeCRS]);

  const localSiteInitialValues = localSiteDraftValues || parseLocalSiteValues();
  const calibrationInitialValues = calibrationDraftValues || parseCalibrationValues();
  const crsIdentity = {
    horizontalName: activeCRS?.horizontalComponent || activeCRS?.name || 'Not defined',
    verticalName: activeCRS?.verticalComponent || activeCRS?.verticalDatum || 'Not defined'
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-1">
        {hasProjectedCRS && (
          <div className="flex bg-[#eaeaef] rounded-[2px] p-[2px]">
            <button 
              onClick={() => onViewModeChange('summary')} 
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${viewMode === 'summary' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976] hover:bg-[#d0d0d7]/50'}`}
            >
              Summary
            </button>
            <button 
              onClick={() => onViewModeChange('detailed')} 
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${viewMode === 'detailed' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976] hover:bg-[#d0d0d7]/50'}`}
            >
              Detailed
            </button>
          </div>
        )}
      </div>

      {!hasProjectedCRS || !activeCRS ? (
        <p className="text-[14px] text-[#6a6976]">No coordinate reference system defined.</p>
      ) : (
          <div className="text-[13px] text-[#363545]">
              {viewMode === 'summary' && (
                <div className="flex flex-col gap-1 mt-2">
                  <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-1">
                    <div className="font-semibold text-[#363545]">Horizontal:</div>
                    <div className="text-[#363545]">
                      {activeCRS.horizontalComponent || activeCRS.name}
                      {hasLocalSite && <span className="text-[#005f9e] font-semibold ml-1.5 text-[11px]">[Local Site]</span>}
                      {hasHzCalibration && <span className="text-[#005f9e] font-semibold ml-1.5 text-[11px]">[Calibrated]</span>}
                    </div>

                    <div className="font-semibold text-[#363545]">Vertical:</div>
                    <div className="text-[#363545]">
                      {activeCRS.verticalComponent || activeCRS.verticalDatum || '-'}
                      {hasVtCalibration && <span className="text-[#005f9e] font-semibold ml-1.5 text-[11px]">[Calibrated]</span>}
                    </div>

                    <div className="font-semibold text-[#363545]">Unit:</div>
                    <div className="text-[#363545]">{activeCRS.unit || 'Meter'}</div>
                  </div>
                </div>
              )}

              {viewMode === 'detailed' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                  {/* Column 1: CRS */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-[#363545] text-[13px]">CRS</h4>
                      {onEditCRS && (
                        <button 
                          onClick={onEditCRS}
                          className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                          title="Edit CRS"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="text-[#6a6976] text-[12px] mb-0.5">Name:</div>
                        <div className="text-[#363545] text-[13px]">{activeCRS.horizontalComponent ?? activeCRS.name ?? '-'}</div>
                      </div>

                      <div>
                        <div className="text-[#6a6976] text-[12px] mb-0.5">Datum:</div>
                        <div className="text-[#363545] text-[13px]">{activeCRS.datum || '-'}</div>
                      </div>

                      <div>
                        <div className="text-[#6a6976] text-[12px] mb-0.5">Unit:</div>
                        <div className="text-[#363545] text-[13px]">{activeCRS.unit || 'Meter'}</div>
                      </div>

                      <div>
                        <div className="text-[#6a6976] text-[12px] mb-0.5">Geoid:</div>
                        <div className="text-[#363545] text-[13px]">{activeCRS.geoid ?? activeCRS.verticalDatum ?? '-'}</div>
                      </div>

                      <div>
                        <div className="text-[#6a6976] text-[12px] mb-0.5">EPSG Code:</div>
                        <div className="text-[#363545] text-[13px]">{activeCRS.code || '-'}</div>
                      </div>

                    </div>
                  </div>

                  {/* Column 2: Local Site */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-[#363545] text-[13px]">Local Site</h4>
                      {onUpdateLocalSite && activeCRS.localSite && (
                        <button 
                          onClick={() => setShowLocalSiteDialog(true)}
                          className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                          title="Edit Local Site"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {activeCRS.localSite ? (
                        visibleLocalSiteFields.length > 0 ? (
                          <div className="flex flex-col gap-4">
                            {visibleLocalSiteFields.map((field) => (
                              <div key={field.label}>
                                <div className="text-[#6a6976] text-[12px] mb-0.5">{field.label}:</div>
                                <div className="text-[#363545] text-[13px]">{field.value}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[#6a6976] text-[13px] italic">Not configured</div>
                        )
                    ) : (
                        <div className="flex flex-col gap-2">
                          <div className="text-[#6a6976] text-[13px] italic">Not configured</div>
                          {onUpdateLocalSite && (
                            <button 
                              onClick={() => setShowLocalSiteDialog(true)}
                              className="text-[12px] text-[#005f9e] hover:underline text-left"
                            >
                              + Add Local Site Settings
                            </button>
                          )}
                        </div>
                    )}
                  </div>

                  {/* Column 3: Site Calibration */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-[#363545] text-[13px]">Site Calibration</h4>
                      {onUpdateCalibration && activeCRS.calibration && (
                        <button 
                          onClick={() => setShowCalibrationDialog(true)}
                          className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                          title="Edit Calibration"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {activeCRS.calibration ? (
                        visibleCalibrationFields.length > 0 ? (
                          <div className="flex flex-col gap-4">
                            {visibleCalibrationFields.map((field) => (
                              <div key={field.label}>
                                <div className="text-[#6a6976] text-[12px] mb-0.5">{field.label}:</div>
                                <div className="text-[#363545] text-[13px]">{field.value}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[#6a6976] text-[13px] italic">Not configured</div>
                        )
                    ) : (
                        <div className="flex flex-col gap-2">
                          <div className="text-[#6a6976] text-[13px] italic">Not configured</div>
                          {onUpdateCalibration && (
                            <button 
                              onClick={() => setShowCalibrationDialog(true)}
                              className="text-[12px] text-[#005f9e] hover:underline text-left"
                            >
                              + Add Site Calibration
                            </button>
                          )}
                        </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

      {/* Local Site Settings Dialog */}
      <LocalSiteSettingsDialog 
        isOpen={showLocalSiteDialog}
        onClose={() => {
          setShowLocalSiteDialog(false);
          setLocalSiteDraftValues(null);
        }}
        onConfirm={handleLocalSiteUpdate}
        initialValues={localSiteInitialValues}
        unitLabel={unitLabel}
      />

      {pendingLocalSiteUpdate && (
        <LocalSiteSettingsConfirmationDialog
          isOpen={showLocalSiteConfirmDialog}
          onClose={handleCloseLocalSiteConfirmation}
          onBack={() => {
            setShowLocalSiteConfirmDialog(false);
            setShowLocalSiteDialog(true);
          }}
          onApply={handleApplyLocalSiteUpdate}
          previousCRS={crsIdentity}
          newCRS={crsIdentity}
          previousLocalSite={pendingLocalSitePrevious}
          newLocalSite={pendingLocalSiteChanges || pendingLocalSiteUpdate}
          previousCalibration={activeCRS?.calibration}
          newCalibration={activeCRS?.calibration}
        />
      )}

      {/* Site Calibration Dialog */}
      <SiteCalibrationDialog
        isOpen={showCalibrationDialog}
        onClose={() => {
          setShowCalibrationDialog(false);
          setCalibrationDraftValues(null);
        }}
        onConfirm={handleCalibrationUpdate}
        initialValues={calibrationInitialValues}
        unitLabel={unitLabel}
      />

      {pendingCalibrationUpdate && (
        <SiteCalibrationConfirmationDialog
          isOpen={showCalibrationConfirmDialog}
          onClose={handleCloseCalibrationConfirmation}
          onBack={() => {
            setShowCalibrationConfirmDialog(false);
            setShowCalibrationDialog(true);
          }}
          onApply={handleApplyCalibrationUpdate}
          previousCRS={crsIdentity}
          newCRS={crsIdentity}
          previousCalibration={pendingCalibrationPrevious}
          newCalibration={pendingCalibrationChanges || pendingCalibrationUpdate}
          previousLocalSite={activeCRS?.localSite}
          newLocalSite={activeCRS?.localSite}
        />
      )}
    </div>
  );
};

export default CRSDisplay;