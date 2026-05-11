import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Globe, X } from "lucide-react";

interface CRSDetails {
  name: string;
  datum?: string;
  verticalDatum?: string;
  hasLocalSite?: boolean;
  hasCalibration?: boolean;
}

interface CRSWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onBack: () => void;
  currentCRS: string;
  newCRS: string;
  currentCRSDetails?: CRSDetails | null;
  newCRSDetails?: CRSDetails | null;
}

type Severity = 'compatible' | 'warning' | 'critical';

const CRSWarningDialog: React.FC<CRSWarningDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onBack,
  currentCRS, 
  newCRS,
  currentCRSDetails,
  newCRSDetails
}) => {
  const [confirmed, setConfirmed] = useState(false);

  // Determine the severity and impacts of the change
  const { severity, impacts } = useMemo(() => {
    const impactList: { message: string; severity: 'info' | 'warning' | 'critical' }[] = [];
    let sev: Severity = 'compatible';

    // If no current CRS, this is a new addition
    if (!currentCRSDetails || currentCRS === "No coordinate reference system defined.") {
      return {
        severity: 'compatible' as Severity,
        impacts: []
      };
    }

    // Check datum change
    if (currentCRSDetails.datum && newCRSDetails?.datum && currentCRSDetails.datum !== newCRSDetails.datum) {
      impactList.push({ message: 'Existing coordinates may shift position', severity: 'warning' });
      impactList.push({ message: 'Published data will need recalculation', severity: 'warning' });
      sev = 'critical';
    }

    // Check vertical datum change
    if (currentCRSDetails.verticalDatum && newCRSDetails?.verticalDatum && 
        currentCRSDetails.verticalDatum !== newCRSDetails.verticalDatum) {
      impactList.push({ message: 'Elevation values may change', severity: 'warning' });
      if (sev === 'compatible') sev = 'warning';
    }

    // Check local site changes
    if (currentCRSDetails.hasLocalSite !== newCRSDetails?.hasLocalSite) {
      impactList.push({ message: 'Grid to ground transformations will change', severity: 'info' });
      if (sev === 'compatible') sev = 'warning';
    }

    // Check calibration changes
    if (currentCRSDetails.hasCalibration !== newCRSDetails?.hasCalibration) {
      impactList.push({ message: 'Calibration settings will be modified', severity: 'info' });
      if (sev === 'compatible') sev = 'warning';
    }

    // If no specific changes detected but CRS names differ
    if (impactList.length === 0 && currentCRS !== newCRS) {
      sev = 'warning';
      impactList.push({ message: 'The coordinate reference system configuration will change', severity: 'info' });
    }

    return { severity: sev, impacts: impactList };
  }, [currentCRS, newCRS, currentCRSDetails, newCRSDetails]);

  // Parse CRS names for display in cards
  const previousCRSInfo = useMemo(() => {
    if (!currentCRSDetails || currentCRS === "No coordinate reference system defined.") {
      return null;
    }
    const parts = currentCRS.split('+');
    return {
      horizontalName: parts[0]?.trim() || currentCRS,
      verticalName: parts[1]?.trim() || currentCRSDetails.verticalDatum || ''
    };
  }, [currentCRS, currentCRSDetails]);

  const newCRSInfo = useMemo(() => {
    const parts = newCRS.split('+');
    return {
      horizontalName: parts[0]?.trim() || newCRS,
      verticalName: parts[1]?.trim() || newCRSDetails?.verticalDatum || ''
    };
  }, [newCRS, newCRSDetails]);

  // Reset confirmed state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasPreviousCRS = !!previousCRSInfo;
  const requiresConfirmation = severity !== 'compatible';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[48rem] max-h-[90vh] bg-white shadow-xl rounded-[2px] overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-[#d0d0d7]">
          <h2 className="text-[18px] font-bold text-[#363545]">Configure coordinate reference system</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
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
                      <div className="text-[13px] text-[#363545]">{previousCRSInfo?.horizontalName}</div>
                    </div>
                  </div>
                  
                  {/* Vertical */}
                  {previousCRSInfo?.verticalName && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#6a6976] mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-[12px] font-semibold text-[#6a6976]">Vertical CRS</div>
                        <div className="text-[13px] text-[#363545]">{previousCRSInfo?.verticalName}</div>
                      </div>
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
                  <div>
                    <div className="text-[12px] font-semibold text-[#363545]">Horizontal CRS</div>
                    <div className="text-[13px] text-[#363545]">{newCRSInfo.horizontalName}</div>
                  </div>
                </div>
                
                {/* Vertical */}
                {newCRSInfo.verticalName && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#e88c30] mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="text-[12px] font-semibold text-[#363545]">Vertical CRS</div>
                      <div className="text-[13px] text-[#363545]">{newCRSInfo.verticalName}</div>
                    </div>
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
                This is a new CRS configuration for the project.
              </p>
            )}
          </div>

          {/* Confirmation Checkbox */}
          {requiresConfirmation && (
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
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-end items-center gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button 
            onClick={onConfirm} 
            disabled={requiresConfirmation && !confirmed}
            className={`text-white text-[14px] font-bold py-2 px-5 rounded-[2px] transition-colors ${
              requiresConfirmation && !confirmed 
                ? 'bg-[#d0d0d7] cursor-not-allowed' 
                : 'bg-[#005f9e] hover:bg-[#00437b]'
            }`}
          >
            Apply changes
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CRSWarningDialog;
