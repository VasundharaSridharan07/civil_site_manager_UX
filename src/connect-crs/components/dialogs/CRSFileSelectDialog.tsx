// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, FileText, Upload, Loader2, AlertTriangle, Check, FileQuestion, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import CRSPreviewPanel from '../crs/CRSPreviewPanel';
import CRSConfirmationStep from '../crs/CRSConfirmationStep';
import type { CRSItem, LocalSiteSettings, SiteCalibrationSettings } from '../../types';
import { importJxlFile, importCalFile } from '../../api/crsApi';
import type { JxlImportExtents, JxlImportParsedCRS } from '../../api/crsApi';

/** Convert API extents (minLat, maxLat, minLon, maxLon) to a rectangle boundary (5 points to close). */
function extentsToBoundaryPoints(extents: JxlImportExtents): { lat: number; lng: number }[] {
  const { minLat, maxLat, minLon, maxLon } = extents;
  if (minLat == null || maxLat == null || minLon == null || maxLon == null) return [];
  return [
    { lat: minLat, lng: minLon },
    { lat: minLat, lng: maxLon },
    { lat: maxLat, lng: maxLon },
    { lat: maxLat, lng: minLon },
    { lat: minLat, lng: minLon },
  ];
}

interface CRSFileSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File, crsItem: CRSItem) => void;
  onBack?: () => void;
  boundaryPoints?: { lat: number; lng: number }[];
  viewState?: { lat: number; lng: number; zoom?: number };
  currentCRS?: CRSItem | null;
}

type DialogStep = 'upload' | 'scanning' | 'resolve' | 'mainEdit' | 'confirmation';

interface MissingFileRequirement {
  name: string;
  type: string;
}

const UNIT_OPTIONS = [
  { value: 'ft', label: 'International Foot' },
  { value: 'ftUS', label: 'US Survey Foot' },
  { value: 'm', label: 'Meters' },
  { value: 'Angular', label: 'Angular' }
];

const CRSFileSelectDialog: React.FC<CRSFileSelectDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  onBack,
  boundaryPoints = [],
  viewState = { lat: 50, lng: 10, zoom: 4 },
  currentCRS = null
}) => {
  const [step, setStep] = useState<DialogStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [missingRequirements, setMissingRequirements] = useState<MissingFileRequirement[]>([]);
  const [resolvedFiles, setResolvedFiles] = useState<Record<string, File>>({});
  
  // Parsed CRS from file (mock or JXL import result)
  const [parsedCRS, setParsedCRS] = useState<Pick<JxlImportParsedCRS, 'horizontalName' | 'horizontalCode' | 'verticalName' | 'verticalCode' | 'datum' | 'verticalDatum' | 'localSite' | 'calibration' | 'extents'> | null>(null);
  
  const [selectedUnit, setSelectedUnit] = useState<string>('m');
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resolveInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setSelectedFile(null);
      setMissingRequirements([]);
      setResolvedFiles({});
      setParsedCRS(null);
      setSelectedUnit('m');
      setConfirmationChecked(false);
      setImportError(null);
    }
  }, [isOpen]);

  // Boundary points for map: project boundary or extents from JXL import response
  const displayBoundaryPoints = useMemo(() => {
    if (boundaryPoints.length >= 2) return boundaryPoints;
    if (parsedCRS?.extents) return extentsToBoundaryPoints(parsedCRS.extents);
    return [];
  }, [boundaryPoints, parsedCRS?.extents]);

  // Calculate preview view state from display boundary (or extents) so map fits the zone
  const previewViewState = useMemo(() => {
    if (displayBoundaryPoints.length >= 2) {
      const lats = displayBoundaryPoints.map(p => p.lat);
      const lngs = displayBoundaryPoints.map(p => p.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      
      const latDiff = Math.max(...lats) - Math.min(...lats);
      const lngDiff = Math.max(...lngs) - Math.min(...lngs);
      const maxDiff = Math.max(latDiff, lngDiff);
      
      let zoom = 17;
      if (maxDiff > 0.01) zoom = 15;
      else if (maxDiff > 0.005) zoom = 16;
      else if (maxDiff > 0.002) zoom = 17;
      else zoom = 18;
      
      return { lat: centerLat, lng: centerLng, zoom };
    }
    return { ...viewState, zoom: 17 };
  }, [displayBoundaryPoints, viewState]);

  if (!isOpen) return null;

  const handleMainDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleMainDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleMainDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError(null);
    }
  };

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError(null);
    }
    e.target.value = '';
  };

  const handleUploadNext = async () => {
    if (!selectedFile) return;
    
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    setStep('scanning');
    setImportError(null);

    if (ext === '.jxl') {
      try {
        const result = await importJxlFile(selectedFile);
        setParsedCRS({
          horizontalName: result.horizontalName,
          horizontalCode: result.horizontalCode,
          verticalName: result.verticalName,
          verticalCode: result.verticalCode,
          datum: result.datum,
          verticalDatum: result.verticalDatum,
          localSite: result.localSite,
          calibration: result.calibration,
          extents: result.extents,
        });
        if (result.unit) {
          const u = result.unit.toLowerCase();
          const unitValue = u.includes('foot') || u.includes('survey') ? 'ftUS' : u.includes('angular') || u.includes('degree') ? 'Angular' : 'm';
          setSelectedUnit(unitValue);
        }
        setStep('confirmation');
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import JXL file.');
        setStep('upload');
      }
      return;
    }

    if (ext === '.cal') {
      try {
        const result = await importCalFile(selectedFile);
        setParsedCRS({
          horizontalName: result.horizontalName,
          horizontalCode: result.horizontalCode,
          verticalName: result.verticalName,
          verticalCode: result.verticalCode,
          datum: result.datum,
          verticalDatum: result.verticalDatum,
          localSite: result.localSite,
          calibration: result.calibration,
          extents: result.extents,
        });
        if (result.unit) {
          const u = result.unit.toLowerCase();
          const unitValue = u.includes('foot') || u.includes('survey') ? 'ftUS' : u.includes('angular') || u.includes('degree') ? 'Angular' : 'm';
          setSelectedUnit(unitValue);
        }
        setStep('confirmation');
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import CAL file.');
        setStep('upload');
      }
      return;
    }

    if (ext === '.dc') {
      // .dc files: mock – check for referenced files, then resolve step (unchanged)
      setTimeout(() => {
        const fileName = selectedFile.name.replace(/\.[^.]+$/, '');
        setParsedCRS({
          horizontalName: `NAD83(2011) / ${fileName}`,
          horizontalCode: 'EPSG:6428',
          verticalName: 'NAVD88 height',
          verticalCode: 'EPSG:5703',
          datum: 'NAD83(2011)',
          verticalDatum: 'NAVD88'
        });
        setMissingRequirements([
          { name: 'custom_geoid.ggf', type: 'Geoid Model' }
        ]);
        setStep('resolve');
      }, 1500);
      return;
    }

    // Other extensions: mock parsing
    setTimeout(() => {
      const fileName = selectedFile.name.replace(/\.[^.]+$/, '');
      setParsedCRS({
        horizontalName: `NAD83(2011) / ${fileName}`,
        horizontalCode: 'EPSG:6428',
        verticalName: 'NAVD88 height',
        verticalCode: 'EPSG:5703',
        datum: 'NAD83(2011)',
        verticalDatum: 'NAVD88'
      });
      setStep('mainEdit');
    }, 1500);
  };

  const handleResolveDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleResolveDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleResolveDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files) as File[];
    processResolvedFiles(files);
  };

  const handleResolveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      processResolvedFiles(files);
    }
    e.target.value = '';
  };

  const processResolvedFiles = (files: File[]) => {
    const newResolved = { ...resolvedFiles };
    files.forEach(file => {
      const match = missingRequirements.find(req => req.name.toLowerCase() === file.name.toLowerCase());
      if (match) {
        newResolved[match.name] = file;
      }
    });
    setResolvedFiles(newResolved);
  };

  const isAllResolved = missingRequirements.every(req => !!resolvedFiles[req.name]);

  const handleResolveNext = () => {
    if (isAllResolved) {
      setStep('mainEdit');
    }
  };

  const handleMainEditNext = () => {
    setStep('confirmation');
  };

  const handleBack = () => {
    if (step === 'resolve') setStep('upload');
    else if (step === 'mainEdit') {
      if (missingRequirements.length > 0) setStep('resolve');
      else setStep('upload');
    }
    else if (step === 'confirmation') setStep('upload');
  };

  const handleConfirm = () => {
    if (!selectedFile || !parsedCRS) return;
    
    const crsItem: CRSItem = {
      code: 'EPSG:6428',
      name: `${parsedCRS.horizontalName} + ${parsedCRS.verticalName}`,
      area: 'Project Location',
      type: 'Compound',
      unit: UNIT_OPTIONS.find(o => o.value === selectedUnit)?.label || 'Meters',
      latLong: '-',
      horizontalComponent: parsedCRS.horizontalName,
      verticalComponent: parsedCRS.verticalName,
      horizontalCode: parsedCRS.horizontalCode,
      verticalCode: parsedCRS.verticalCode,
      datum: parsedCRS.datum,
      verticalDatum: parsedCRS.verticalDatum,
      ...(parsedCRS.localSite && { localSite: parsedCRS.localSite }),
      ...(parsedCRS.calibration && { calibration: parsedCRS.calibration }),
    };
    
    onConfirm(selectedFile, crsItem);
  };

  const requiresConfirmation = !!currentCRS;
  const canConfirm = !requiresConfirmation || confirmationChecked;

  // Build confirmation info
  const previousCRSInfo = currentCRS ? {
    horizontalName: currentCRS.horizontalComponent || currentCRS.name.split('+')[0]?.trim(),
    horizontalCode: currentCRS.horizontalCode || currentCRS.code,
    verticalName: currentCRS.verticalComponent || currentCRS.name.split('+')[1]?.trim(),
    verticalCode: currentCRS.verticalCode,
    localSite: currentCRS.localSite,
    calibration: currentCRS.calibration
  } : null;

  const newCRSInfo = parsedCRS ? {
    horizontalName: parsedCRS.horizontalName,
    horizontalCode: parsedCRS.horizontalCode,
    verticalName: parsedCRS.verticalName,
    verticalCode: parsedCRS.verticalCode,
    localSite: parsedCRS.localSite,
    calibration: parsedCRS.calibration
  } : { horizontalName: '', horizontalCode: '', verticalName: '', verticalCode: '' };

  const getStepNumber = () => {
    switch (step) {
      case 'upload': return 1;
      case 'scanning': return 1;
      case 'resolve': return 1;
      case 'mainEdit': return 2;
      case 'confirmation': return 2;
    }
  };

  const currentStepNum = getStepNumber();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className={`relative flex flex-col bg-white shadow-xl rounded-[2px] overflow-hidden transition-all duration-300 ${
        step === 'mainEdit' || step === 'confirmation' ? 'w-[90vw] h-[85vh] max-w-[1400px]' : 'w-[44rem]'
      }`}>
        
        {/* Header */}
        <header className="bg-white border-b border-[#d0d0d7]">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-[18px] font-bold text-[#363545] m-0">Configure coordinate reference system</h2>
            {step !== 'scanning' && (
              <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
            )}
          </div>
          {(step === 'mainEdit' || step === 'confirmation') && (
            <div className="flex items-center gap-3 px-6 pb-4">
              <div className="flex flex-col items-center gap-1.5 text-[#005f9e]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold bg-[#005f9e] text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-[12px] font-semibold">Upload</span>
              </div>
              <div className="w-12 h-px bg-[#d0d0d7] mt-[-20px]"></div>
              <div className={`flex flex-col items-center gap-1.5 ${currentStepNum === 2 ? 'text-[#005f9e]' : 'text-[#6a6976]'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${
                  currentStepNum === 2 ? 'bg-[#005f9e] text-white' : 'bg-[#eaeaef] text-[#6a6976]'
                }`}>
                  2
                </div>
                <span className="text-[12px] font-semibold">Confirm</span>
              </div>
            </div>
          )}
        </header>
        
        {/* UPLOAD STEP */}
        {step === 'upload' && (
          <>
            <div className="p-6">
              <div className="bg-[#f3f3f7] border border-[#d0d0d7] rounded-[4px] p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-[#6a6976]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#363545] mb-2">Upload CRS</h3>
                  <p className="text-[14px] text-[#6a6976] mb-6 max-w-md">
                    Upload a local file to define the project's coordinate reference system. Supported formats: .cal, .jxl, .dc.
                  </p>

                  {importError && (
                    <div className="mb-4 p-4 bg-[#fef2f2] border border-[#fecaca] rounded-[2px] flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#a51d25] flex-shrink-0 mt-0.5" />
                      <div className="text-[14px] text-[#363545]">
                        <p className="font-semibold text-[#a51d25] mb-1">Import failed</p>
                        <p className="text-[#6a6976]">{importError}</p>
                      </div>
                    </div>
                  )}
                  
                  <input type="file" ref={fileInputRef} onChange={handleMainFileChange} className="hidden" accept=".cal,.jxl,.dc" />
                  
                  {selectedFile ? (
                    <div className="flex items-center gap-3 p-3 bg-white border border-[#005f9e] rounded-[2px] w-full max-w-md text-left">
                      <FileText className="w-5 h-5 text-[#005f9e]" />
                      <div className="flex-1">
                        <div className="text-[14px] font-semibold text-[#363545]">{selectedFile.name}</div>
                        <div className="text-[12px] text-[#6a6976]">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="text-[12px] text-[#005f9e] hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-[#d0d0d7] hover:border-[#005f9e] rounded-[2px] p-6 text-center cursor-pointer transition-colors w-full max-w-md"
                      onDragEnter={handleMainDragEnter}
                      onDragOver={handleMainDragOver}
                      onDrop={handleMainDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <p className="text-[14px] text-[#005f9e] font-semibold">Click to browse or drag and drop</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="flex justify-end gap-3 p-6 border-t border-[#d0d0d7]">
              <button 
                onClick={onBack || onClose}
                className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleUploadNext}
                disabled={!selectedFile}
                className={`flex items-center gap-2 text-white text-[14px] font-bold py-2 px-6 rounded-[2px] ${
                  selectedFile ? 'bg-[#005f9e] hover:bg-[#00437b]' : 'bg-[#d0d0d7] cursor-not-allowed'
                }`}
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}

        {/* SCANNING STEP */}
        {step === 'scanning' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-[#005f9e] animate-spin mb-4" />
            <p className="text-[16px] font-bold text-[#363545]">Analyzing file...</p>
            <p className="text-[14px] text-[#6a6976] mt-2">Checking for external file references</p>
          </div>
        )}

        {/* RESOLVE STEP */}
        {step === 'resolve' && (
          <>
            <div className="p-6">
              <div className="bg-[#fff4e5] border border-[#fbad26] rounded-[2px] p-4 flex items-start gap-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-[#bf7806] flex-shrink-0 mt-0.5" />
                <div className="text-[14px] text-[#363545]">
                  <p className="font-bold text-[#bf7806] mb-1">Action Required</p>
                  The selected file references external files that are missing. Please upload the required files to proceed.
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-[14px] font-bold text-[#363545] mb-2">Missing References</h3>
                <div className="border border-[#d0d0d7] rounded-[2px] divide-y divide-[#d0d0d7]">
                  {missingRequirements.map((req) => {
                    const isResolved = !!resolvedFiles[req.name];
                    return (
                      <div key={req.name} className={`flex items-center justify-between p-3 ${isResolved ? 'bg-[#f0fdf4]' : 'bg-white'}`}>
                        <div className="flex items-center gap-3">
                          {isResolved ? (
                            <div className="w-8 h-8 rounded-full bg-[#5e9331]/10 flex items-center justify-center">
                              <Check className="w-4 h-4 text-[#5e9331]" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#f3f3f7] flex items-center justify-center">
                              <FileQuestion className="w-4 h-4 text-[#6a6976]" />
                            </div>
                          )}
                          <div>
                            <div className={`text-[14px] font-semibold ${isResolved ? 'text-[#363545]' : 'text-[#a51d25]'}`}>{req.name}</div>
                            <div className="text-[12px] text-[#6a6976]">{req.type}</div>
                          </div>
                        </div>
                        <div className="text-[12px] font-semibold">
                          {isResolved ? <span className="text-[#5e9331]">Ready</span> : <span className="text-[#a51d25]">Missing</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <input type="file" ref={resolveInputRef} onChange={handleResolveFileChange} className="hidden" multiple />

              <div 
                className="border border-dashed border-[#d0d0d7] hover:border-[#005f9e] hover:bg-[#f9f9fb] rounded-[2px] h-[80px] flex flex-col items-center justify-center cursor-pointer transition-colors"
                onDragEnter={handleResolveDragEnter}
                onDragOver={handleResolveDragOver}
                onDrop={handleResolveDrop}
                onClick={() => resolveInputRef.current?.click()}
              >
                <div className="flex items-center gap-2 text-[#005f9e]">
                  <Upload className="w-4 h-4" />
                  <span className="text-[14px] font-semibold">Upload missing files</span>
                </div>
              </div>
            </div>

            <footer className="flex justify-end items-center gap-3 p-6 border-t border-[#d0d0d7]">
              <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleResolveNext}
                disabled={!isAllResolved}
                className={`flex items-center gap-2 text-white text-[14px] font-bold py-2 px-6 rounded-[2px] ${
                  isAllResolved ? 'bg-[#005f9e] hover:bg-[#00437b]' : 'bg-[#aeb0b6] cursor-not-allowed'
                }`}
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}

        {/* MAIN EDIT STEP */}
        {step === 'mainEdit' && parsedCRS && (
          <>
            <div className="flex-1 overflow-hidden">
              <CRSPreviewPanel
                selectedCRS={null}
                horizontalCRS={{
                  code: parsedCRS.horizontalCode,
                  name: parsedCRS.horizontalName,
                  unit: UNIT_OPTIONS.find(o => o.value === selectedUnit)?.label
                }}
                verticalCRS={{
                  code: parsedCRS.verticalCode,
                  name: parsedCRS.verticalName,
                  unit: UNIT_OPTIONS.find(o => o.value === selectedUnit)?.label
                }}
                boundaryPoints={displayBoundaryPoints}
                locationMarker={null}
                viewState={previewViewState}
                mapType="s"
                showEditButton={false}
                showUnitSelector={false}
                selectedUnit={selectedUnit}
                onUnitChange={setSelectedUnit}
                showLocalSiteSection={true}
                localSiteSettings={parsedCRS.localSite ? {
                  latitude: parsedCRS.localSite.projectLatitude,
                  longitude: parsedCRS.localSite.projectLongitude,
                  height: parsedCRS.localSite.projectHeight,
                  scaleFactor: parsedCRS.localSite.groundScaleFactor,
                  northingOffset: parsedCRS.localSite.northingOffset,
                  eastingOffset: parsedCRS.localSite.eastingOffset,
                } : null}
                calibrationSettings={parsedCRS.calibration ? {
                  horizontal: parsedCRS.calibration.horizontalAdjustment,
                  vertical: parsedCRS.calibration.verticalAdjustment,
                } : null}
                allowMapInteraction={true}
              />
            </div>
            
            <footer className="flex justify-end items-center gap-3 p-6 border-t border-[#d0d0d7]">
              <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleMainEditNext}
                className="flex items-center gap-2 text-white text-[14px] font-bold py-2 px-6 rounded-[2px] bg-[#005f9e] hover:bg-[#00437b]"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}

        {/* CONFIRMATION STEP */}
        {step === 'confirmation' && (
          <>
            <div className="flex-1 overflow-y-auto bg-white">
              <CRSConfirmationStep
                previousCRS={previousCRSInfo}
                newCRS={newCRSInfo}
                impacts={currentCRS ? [
                  { message: '<impacts to be defined>', severity: 'info' }
                ] : []}
                requiresConfirmation={requiresConfirmation}
                isConfirmed={confirmationChecked}
                onConfirmChange={setConfirmationChecked}
              />
            </div>
            
            <footer className="flex justify-end items-center gap-3 p-6 border-t border-[#d0d0d7]">
              <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`text-white text-[14px] font-bold py-2 px-6 rounded-[2px] ${
                  canConfirm ? 'bg-[#005f9e] hover:bg-[#00437b]' : 'bg-[#aeb0b6] cursor-not-allowed'
                }`}
              >
                Apply changes
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default CRSFileSelectDialog;
