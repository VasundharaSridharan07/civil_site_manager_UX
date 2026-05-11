import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, Loader2, ArrowRight, ArrowLeft, Globe, Layers, CheckCircle2, Workflow, Pencil, Upload, ChevronDown, FileText } from "lucide-react";
import { fetchCRSData } from '../../data/crsData';
import type { CRSItem } from '../../types';
import { useCRSFilter } from '../../hooks/useCRSFilter';
import CRSFilterBar from '../crs/CRSFilterBar';
import CRSTable from '../crs/CRSTable';
import CombineCRSSelector from '../crs/CombineCRSSelector';
import CRSPreviewPanel from '../crs/CRSPreviewPanel';
import CRSConfirmationStep from '../crs/CRSConfirmationStep';

interface DefineCustomCRSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onConfirm: (crs: CRSItem) => void;
  viewState: { lat: number, lng: number, zoom?: number };
  serverLocation?: string;
  searchMarker: { lat: number, lng: number } | null;
  boundaryPoints: { lat: number, lng: number }[];
  currentCRS?: CRSItem | null;
}

type Step = 'method' | 'selection' | 'buildMethod' | 'horizontalMethod' | 'defineParameters' | 'uploadGridFile' | 'verticalMethod' | 'uploadCustomGeoid' | 'selectHorizontal' | 'selectVertical' | 'combine' | 'mainEdit' | 'confirmation';

const UNIT_OPTIONS = [
  { value: 'ft', label: 'International Foot' },
  { value: 'ftUS', label: 'US Survey Foot' },
  { value: 'm', label: 'Meters' },
  { value: 'Angular', label: 'Angular' }
];

const DefineCustomCRSDialog: React.FC<DefineCustomCRSDialogProps> = ({ 
  isOpen, 
  onClose,
  onBack,
  onConfirm,
  viewState,
  serverLocation = "Europe",
  searchMarker,
  boundaryPoints,
  currentCRS = null
}) => {
  const [step, setStep] = useState<Step>('method');
  const [crsData, setCrsData] = useState<CRSItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- STATE: METHOD SELECTION ---
  const [baselineMethod, setBaselineMethod] = useState<'compound' | 'combine'>('compound');
  
  // --- STATE: BUILD METHOD (D05A) ---
  const [buildMethod, setBuildMethod] = useState<'existing' | 'custom'>('existing');
  
  // --- STATE: HORIZONTAL CRS METHOD ---
  const [horizontalMethod, setHorizontalMethod] = useState<'published' | 'parameters' | 'file'>('published');
  const [horizontalParams, setHorizontalParams] = useState({
    systemName: '',
    projectionMethod: 'Transverse Mercator',
    referenceDatum: 'WGS 84',
    centralMeridian: '0.000000000',
    latitudeOfOrigin: '0.000000000',
    scaleFactor: '1.00000000',
    falseEasting: '0.000',
    falseNorthing: '0.000'
  });
  const [horizontalGridSystemName, setHorizontalGridSystemName] = useState('');
  const [horizontalGridFile, setHorizontalGridFile] = useState<File | null>(null);
  const [isGridDropActive, setIsGridDropActive] = useState(false);
  const [verticalMethod, setVerticalMethod] = useState<'published' | 'customGeoid'>('published');
  const [verticalGeoidFile, setVerticalGeoidFile] = useState<File | null>(null);
  const [isVerticalDropActive, setIsVerticalDropActive] = useState(false);

  // --- STATE: COMPOUND SELECTION (Option A) ---
  const [selectedCompound, setSelectedCompound] = useState<CRSItem | null>(null);
  const [crsUnitFilter, setCrsUnitFilter] = useState<string>("All");
  const [selectedUnit, setSelectedUnit] = useState<string>("m");
  const [crsSearchQuery, setCrsSearchQuery] = useState("");
  const [filterCRSByLocation, setFilterCRSByLocation] = useState(true);

  // --- STATE: COMBINE CRS (Option B) ---
  const [builderHorizontal, setBuilderHorizontal] = useState<CRSItem | null>(null);
  const [builderVertical, setBuilderVertical] = useState<CRSItem | null>(null);

  // --- STATE: LOCAL SITE & CALIBRATION ---
  const [localSiteSettings, setLocalSiteSettings] = useState<{
    latitude: string;
    longitude: string;
    height: string;
    scaleFactor: string;
    northingOffset: string;
    eastingOffset: string;
  } | null>(null);
  
  const [calibrationSettings, setCalibrationSettings] = useState<{
    horizontal: string;
    vertical: string;
  } | null>(null);

  // --- STATE: DIALOGS ---
  const [showLocalSiteDialog, setShowLocalSiteDialog] = useState(false);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [showHorizontalEditDialog, setShowHorizontalEditDialog] = useState(false);
  const [showVerticalEditDialog, setShowVerticalEditDialog] = useState(false);
  
  // --- STATE: CONFIRMATION ---
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  
  // Reset/Initialize defaults when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchCRSData().then(data => {
        setCrsData(data);
        setIsLoading(false);
      });
      // Enter this dialog directly at the custom horizontal-method screen.
      setStep('horizontalMethod');
      setBaselineMethod('combine');
      setCrsSearchQuery("");
      const hasLoc = !!(searchMarker || boundaryPoints.length > 0);
      setFilterCRSByLocation(hasLoc);
      setSelectedCompound(null);
      setBuilderHorizontal(null);
      setBuilderVertical(null);
      setCrsUnitFilter("All");
      setSelectedUnit("m");
      setLocalSiteSettings(null);
      setCalibrationSettings(null);
      setConfirmationChecked(false);
      setHorizontalParams({
        systemName: '',
        projectionMethod: 'Transverse Mercator',
        referenceDatum: 'WGS 84',
        centralMeridian: '0.000000000',
        latitudeOfOrigin: '0.000000000',
        scaleFactor: '1.00000000',
        falseEasting: '0.000',
        falseNorthing: '0.000'
      });
      setHorizontalGridSystemName('');
      setHorizontalGridFile(null);
      setIsGridDropActive(false);
      setVerticalMethod('published');
      setVerticalGeoidFile(null);
      setIsVerticalDropActive(false);
    }
  }, [isOpen]);

  // Determine effective location
  const location = useMemo(() => {
    if (searchMarker) return searchMarker;
    if (boundaryPoints.length > 0) {
      const lat = boundaryPoints.reduce((sum, p) => sum + p.lat, 0) / boundaryPoints.length;
      const lng = boundaryPoints.reduce((sum, p) => sum + p.lng, 0) / boundaryPoints.length;
      return { lat, lng };
    }
    return null;
  }, [searchMarker, boundaryPoints]);

  const hasLocation = !!location;

  // Calculate preview view state with appropriate zoom for boundary
  const previewViewState = useMemo(() => {
    if (boundaryPoints.length >= 2) {
      const lats = boundaryPoints.map(p => p.lat);
      const lngs = boundaryPoints.map(p => p.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      
      // Calculate zoom based on boundary extent
      const latDiff = Math.max(...lats) - Math.min(...lats);
      const lngDiff = Math.max(...lngs) - Math.min(...lngs);
      const maxDiff = Math.max(latDiff, lngDiff);
      
      // Estimate zoom level to fit boundary (with some padding)
      let zoom = 17;
      if (maxDiff > 0.01) zoom = 15;
      else if (maxDiff > 0.005) zoom = 16;
      else if (maxDiff > 0.002) zoom = 17;
      else zoom = 18;
      
      return { lat: centerLat, lng: centerLng, zoom };
    }
    return { ...viewState, zoom: 17 };
  }, [boundaryPoints, viewState]);

  // Filter for compound CRS
  const compoundFilter = useCallback((item: CRSItem) => {
    return item.type === 'Compound';
  }, []);

  // Filter for horizontal CRS (Projected or Geographic)
  const horizontalFilter = useCallback((item: CRSItem) => {
    return item.type === 'Projected' || item.type === 'Geographic';
  }, []);

  // Filter for vertical CRS
  const verticalFilter = useCallback((item: CRSItem) => {
    return item.type === 'Vertical';
  }, []);
  
  const { filteredAndSortedItems, sortConfig, handleSort } = useCRSFilter({
    data: crsData,
    searchQuery: crsSearchQuery,
    location,
    serverLocation,
    filterByLocation: filterCRSByLocation,
    unitFilter: crsUnitFilter,
    customFilter: compoundFilter,
    minResults: 3 // Always show at least 3 options when filtering by location
  });

  const { filteredAndSortedItems: horizontalFilteredItems, sortConfig: horizontalSortConfig, handleSort: handleHorizontalSort } = useCRSFilter({
    data: crsData,
    searchQuery: crsSearchQuery,
    location,
    serverLocation,
    filterByLocation: filterCRSByLocation,
    unitFilter: crsUnitFilter,
    customFilter: horizontalFilter,
    minResults: 3
  });

  const { filteredAndSortedItems: verticalFilteredItems, sortConfig: verticalSortConfig, handleSort: handleVerticalSort } = useCRSFilter({
    data: crsData,
    searchQuery: crsSearchQuery,
    location,
    serverLocation,
    filterByLocation: filterCRSByLocation,
    unitFilter: crsUnitFilter,
    customFilter: verticalFilter,
    minResults: 3
  });

  // Get current horizontal/vertical CRS for display
  const horizontalCRS = useMemo(() => {
    if (baselineMethod === 'compound' && selectedCompound) {
      return {
        code: selectedCompound.horizontalCode || selectedCompound.code,
        name: selectedCompound.horizontalComponent || selectedCompound.name.split('+')[0]?.trim() || selectedCompound.name,
        unit: selectedUnit
      };
    } else if (baselineMethod === 'combine' && builderHorizontal) {
      return {
        code: builderHorizontal.code,
        name: builderHorizontal.name,
        unit: selectedUnit
      };
    }
    return null;
  }, [baselineMethod, selectedCompound, builderHorizontal, selectedUnit]);

  const verticalCRS = useMemo(() => {
    if (baselineMethod === 'compound' && selectedCompound) {
      return {
        code: selectedCompound.verticalCode || '',
        name: selectedCompound.verticalComponent || selectedCompound.name.split('+')[1]?.trim() || selectedCompound.verticalDatum || '',
        unit: selectedUnit
      };
    } else if (baselineMethod === 'combine' && builderVertical) {
      return {
        code: builderVertical.code,
        name: builderVertical.name,
        unit: selectedUnit
      };
    }
    return null;
  }, [baselineMethod, selectedCompound, builderVertical, selectedUnit]);

  const handleMethodSelect = (method: 'compound' | 'combine') => {
    setBaselineMethod(method);
  };

  const handleMethodNext = () => {
    if (baselineMethod === 'compound') {
      // "Select a published compound" path
      setStep('selection'); // Keep existing compound selection flow
    } else {
      // "Build by Combining Components" path - go directly to horizontal method selection
      setStep('horizontalMethod');
    }
  };
  
  const handleBuildMethodSelect = (method: 'existing' | 'custom') => {
    setBuildMethod(method);
  };
  
  const handleBuildMethodNext = () => {
    if (buildMethod === 'existing') {
      // "Build from already existing" path - show horizontal method selection
      setStep('horizontalMethod');
    } else {
      // "Build custom horizontal and vertical" path
      setStep('mainEdit'); // Go directly to main edit screen with map
    }
  };
  
  const handleHorizontalMethodSelect = (method: 'published' | 'parameters' | 'file') => {
    setHorizontalMethod(method);
    
    // Automatically navigate to the next step based on selection
    if (method === 'published') {
      setBuildMethod('existing'); // Set this so the flow knows we're using existing CRS
      setStep('selectHorizontal'); // Go to published CRS selection
    } else if (method === 'parameters') {
      setBuildMethod('custom'); // Set this so the flow knows we're using custom
      setStep('defineParameters');
    } else if (method === 'file') {
      setBuildMethod('custom'); // Set this so the flow knows we're using custom
      setStep('uploadGridFile');
    }
  };

  const handleDefineParametersNext = () => {
    const customHorizontal: CRSItem = {
      code: "Custom Params",
      name: horizontalParams.systemName.trim() || 'Custom Horizontal CRS',
      area: "Project Location",
      type: "Projected",
      unit: "Meter",
      latLong: "-",
      projection: horizontalParams.projectionMethod,
      datum: horizontalParams.referenceDatum
    };

    setBuilderHorizontal(customHorizontal);
    setStep('verticalMethod');
  };

  const handleHorizontalGridFileSelect = (file: File | null) => {
    if (!file) return;
    setHorizontalGridFile(file);
  };

  const handleUploadGridNext = () => {
    const customHorizontal: CRSItem = {
      code: "Custom Grid",
      name: horizontalGridSystemName.trim() || horizontalGridFile?.name || 'Custom Grid CRS',
      area: "Project Location",
      type: "Projected",
      unit: "Meter",
      latLong: "-",
      projection: "Grid File",
      datum: "Custom Grid"
    };

    setBuilderHorizontal(customHorizontal);
    setStep('verticalMethod');
  };

  const handleVerticalMethodSelect = (method: 'published' | 'customGeoid') => {
    setVerticalMethod(method);
  };

  const handleVerticalMethodNext = () => {
    if (verticalMethod === 'published') {
      setStep('selectVertical');
      return;
    }
    setStep('uploadCustomGeoid');
  };

  const handleVerticalGeoidFileSelect = (file: File | null) => {
    if (!file) return;
    setVerticalGeoidFile(file);
  };

  const handleUploadCustomGeoidNext = () => {
    if (!verticalGeoidFile) return;
    handleCustomVerticalDefined(verticalGeoidFile);
  };

  const handleCompoundSelect = (item: CRSItem) => {
    setSelectedCompound(item);
    // Map the unit to our simplified unit options
    const unit = item.unit;
    if (unit?.includes('Survey')) setSelectedUnit('ftUS');
    else if (unit?.includes('Feet') || unit?.includes('Foot')) setSelectedUnit('ft');
    else if (unit?.includes('Meter')) setSelectedUnit('m');
    else setSelectedUnit('m');
  };

  const handleHorizontalSelect = (item: CRSItem) => {
    setBuilderHorizontal(item);
    const unit = item.unit;
    if (unit?.includes('Survey')) setSelectedUnit('ftUS');
    else if (unit?.includes('Feet') || unit?.includes('Foot')) setSelectedUnit('ft');
    else if (unit?.includes('Meter')) setSelectedUnit('m');
    else setSelectedUnit('m');
  };
  
  const handleVerticalSelect = (item: CRSItem) => {
    setBuilderVertical(item);
  };
  
  const handleHorizontalNext = () => {
    setStep('verticalMethod');
  };
  
  const handleVerticalNext = () => {
    setStep('confirmation');
  };
  
  const handleCombineNext = () => {
    setStep('mainEdit'); // D06AB -> Main Edit
  };

  const handleSelectionNext = () => {
    setStep('mainEdit');
  };

  const handleMainEditNext = () => {
    setStep('confirmation');
  };

  const handleBack = () => {
    if (step === 'buildMethod') {
      setStep('method');
    } else if (step === 'horizontalMethod') {
      // Method screen is removed for this entry path; go back to parent dialog.
      if (onBack) {
        onBack();
      } else {
        onClose();
      }
    } else if (step === 'defineParameters') {
      setStep('horizontalMethod');
    } else if (step === 'uploadGridFile') {
      setStep('horizontalMethod');
    } else if (step === 'verticalMethod') {
      if (horizontalMethod === 'published') {
        setStep('selectHorizontal');
      } else if (horizontalMethod === 'parameters') {
        setStep('defineParameters');
      } else {
        setStep('uploadGridFile');
      }
    } else if (step === 'uploadCustomGeoid') {
      setStep('verticalMethod');
    } else if (step === 'selectHorizontal') {
      setStep('horizontalMethod');
    } else if (step === 'selectVertical') {
      setStep('verticalMethod');
    } else if (step === 'combine') {
      setStep('buildMethod');
    } else if (step === 'selection') {
      setStep('method');
    } else if (step === 'mainEdit') {
      // Go back based on which path we came from
      if (baselineMethod === 'compound') {
        setStep('selection');
      } else if (buildMethod === 'existing') {
        setStep('selectVertical');
      } else {
        setStep('horizontalMethod');
      }
    } else if (step === 'confirmation') {
      if (baselineMethod === 'compound') {
        setStep('mainEdit');
      } else {
        setStep('selectVertical');
      }
    }
  };

  const handleCustomHorizontalDefined = (crs: CRSItem) => {
    setBuilderHorizontal(crs);
    setShowHorizontalEditDialog(false);
  };

  const handleCustomVerticalDefined = (file: File) => {
    const geoidCRS: CRSItem = {
      code: "Custom Geoid",
      name: file.name,
      area: "Project Location",
      type: "Vertical",
      unit: "Meter",
      latLong: "-",
      verticalDatum: "Custom Geoid",
      geoid: file.name
    };
    setBuilderVertical(geoidCRS);
    setShowVerticalEditDialog(false);
    setStep('confirmation');
  };

  const handleConfirm = () => {
    let baseHorizontalName = horizontalCRS?.name || "";
    let baseVerticalName = verticalCRS?.name || "";
    let baseHorizontalCode = horizontalCRS?.code;
    let baseVerticalCode = verticalCRS?.code;
    let baseDatum = selectedCompound?.datum || builderHorizontal?.datum;
    let baseVerticalDatum = selectedCompound?.verticalDatum || builderVertical?.name;
    let baseProjection = selectedCompound?.projection || builderHorizontal?.projection;
    let baseGeoid = selectedCompound?.geoid || builderVertical?.geoid;

    let name = `${baseHorizontalName} + ${baseVerticalName}`;
    if (localSiteSettings) name += " [Local Site]";
    if (calibrationSettings) name += " [Calibrated]";

    const newCRS: CRSItem = {
      code: "Custom",
      name: name,
      area: "Project Location",
      type: "Compound",
      unit: UNIT_OPTIONS.find(o => o.value === selectedUnit)?.label || 'Meters',
      latLong: selectedCompound?.latLong || builderHorizontal?.latLong || "-",
      horizontalComponent: baseHorizontalName,
      verticalComponent: baseVerticalName,
      horizontalCode: baseHorizontalCode,
      verticalCode: baseVerticalCode,
      projection: baseProjection,
      datum: baseDatum,
      verticalDatum: baseVerticalDatum,
      geoid: baseGeoid,
      localSite: localSiteSettings ? {
        projectLatitude: localSiteSettings.latitude,
        projectLongitude: localSiteSettings.longitude,
        projectHeight: localSiteSettings.height,
        groundScaleFactor: localSiteSettings.scaleFactor,
        northingOffset: localSiteSettings.northingOffset,
        eastingOffset: localSiteSettings.eastingOffset
      } : undefined,
      calibration: calibrationSettings ? {
        horizontalAdjustment: calibrationSettings.horizontal,
        verticalAdjustment: calibrationSettings.vertical
      } : undefined
    };

    onConfirm(newCRS);
  };

  const canProceedFromSelection = baselineMethod === 'compound' 
    ? !!selectedCompound 
    : (!!builderHorizontal && !!builderVertical);

  // Build confirmation info
  const previousCRSInfo = currentCRS ? {
    horizontalName: currentCRS.horizontalComponent || currentCRS.name.split('+')[0]?.trim(),
    horizontalCode: currentCRS.horizontalCode || currentCRS.code,
    verticalName: currentCRS.verticalComponent || currentCRS.name.split('+')[1]?.trim(),
    verticalCode: currentCRS.verticalCode,
    localSite: currentCRS.localSite,
    calibration: currentCRS.calibration
  } : null;

  const newCRSInfo = {
    horizontalName: horizontalCRS?.name || '',
    horizontalCode: horizontalCRS?.code || '',
    verticalName: verticalCRS?.name || '',
    verticalCode: verticalCRS?.code || '',
    hasLocalSite: !!localSiteSettings,
    hasCalibration: !!calibrationSettings,
    localSite: localSiteSettings ? {
      projectLatitude: localSiteSettings.latitude,
      projectLongitude: localSiteSettings.longitude,
      projectHeight: localSiteSettings.height,
      groundScaleFactor: localSiteSettings.scaleFactor,
      northingOffset: localSiteSettings.northingOffset,
      eastingOffset: localSiteSettings.eastingOffset
    } : undefined,
    calibration: calibrationSettings ? {
      horizontalAdjustment: calibrationSettings.horizontal,
      verticalAdjustment: calibrationSettings.vertical
    } : undefined
  };

  const requiresConfirmation = !!currentCRS;
  const canConfirm = !requiresConfirmation || confirmationChecked;

  // Calculate impacts
  const impacts = useMemo(() => {
    if (!currentCRS) return [];
    const list = [];
    if (currentCRS.datum !== (selectedCompound?.datum || builderHorizontal?.datum)) {
      list.push({ message: 'Existing coordinates may shift position', severity: 'warning' as const });
      list.push({ message: 'Published data will need recalculation', severity: 'warning' as const });
    }
    if (currentCRS.verticalDatum !== (selectedCompound?.verticalDatum || builderVertical?.name)) {
      list.push({ message: 'Elevation values may change', severity: 'warning' as const });
    }
    return list;
  }, [currentCRS, selectedCompound, builderHorizontal, builderVertical]);

  // Dynamic stepper configuration based on path
  const getStepperConfig = () => {
    if (baselineMethod === 'compound') {
      // Path A: Published Compound CRS (4 steps)
      return [
        { id: 'method', label: 'Method', steps: ['method'] },
        { id: 'selection', label: 'Select CRS', steps: ['selection'] },
        { id: 'mainEdit', label: 'Configure', steps: ['mainEdit'] },
        { id: 'confirmation', label: 'Confirm', steps: ['confirmation'] }
      ];
    } else {
      // Custom CRS flow: keep stepper to 3 high-level steps
      return [
        { id: 'defineHorizontal', label: 'Define Horizontal', steps: ['horizontalMethod', 'defineParameters', 'uploadGridFile', 'selectHorizontal'] },
        { id: 'defineVertical', label: 'Define Vertical', steps: ['verticalMethod', 'uploadCustomGeoid', 'selectVertical'] },
        { id: 'confirmation', label: 'Confirm', steps: ['confirmation'] }
      ];
    }
  };

  const stepperConfig = getStepperConfig();
  
  // Calculate current step index based on path and state
  let currentStepIndex = stepperConfig.findIndex(config => config.steps.includes(step));
  if (currentStepIndex < 0) currentStepIndex = 0;
  
  // For legacy paths that still include mainEdit in stepper, determine sub-step index.
  if (buildMethod === 'custom' && step === 'mainEdit' && stepperConfig.some(config => config.id === 'mainEdit')) {
    if (!builderHorizontal && !builderVertical) {
      currentStepIndex = 2; // Step 3: Add Horizontal
    } else if (builderHorizontal && !builderVertical) {
      currentStepIndex = 3; // Step 4: Add Vertical
    } else {
      currentStepIndex = 4; // Step 5: Configure
    }
  }
  
  const currentStepNum = currentStepIndex + 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[90vw] h-[85vh] max-w-[1100px] bg-[#f9f9fb] shadow-xl rounded-[2px] overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-[#d0d0d7]">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="text-[18px] font-bold text-[#363545] m-0">Configure coordinate reference system</h2>
            <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-3 px-6 pt-2 pb-5">
            {stepperConfig.map((stepConfig, idx) => {
              const stepNumber = idx + 1;
              const isActive = stepNumber === currentStepNum;
              const isCompleted = stepNumber < currentStepNum;
              
              return (
                <React.Fragment key={stepConfig.id}>
                  {idx > 0 && <div className="w-12 h-px bg-[#d0d0d7] mt-[-20px]"></div>}
                  <div className={`flex flex-col items-center gap-1.5 ${
                    isActive ? 'text-[#005f9e]' : 
                    isCompleted ? 'text-[#005f9e]' : 'text-[#6a6976]'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${
                      isActive ? 'bg-[#005f9e] text-white' :
                      isCompleted ? 'bg-[#005f9e] text-white' :
                      'bg-[#eaeaef] text-[#6a6976]'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
                    </div>
                    <span className="text-[12px] font-semibold">{stepConfig.label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-[#005f9e] animate-spin mb-2" />
              <p className="text-[14px] text-[#6a6976]">Loading library...</p>
            </div>
          ) : (
            <>
              {/* STEP: METHOD SELECTION (D04) */}
              {step === 'method' && (
                <div className="flex-1 flex flex-col overflow-hidden p-6">
                  <h3 className="text-[16px] font-bold text-[#363545] mb-2">How do you want to define your baseline CRS?</h3>
                  <p className="text-[14px] text-[#6a6976] mb-6">
                    Choose a published compound CRS for quick setup, or build your own by combining horizontal and vertical components for more control.
                  </p>
                  
                  <div className="flex gap-6">
                    {/* Compound Option */}
                    <button
                      onClick={() => handleMethodSelect('compound')}
                      className={`flex-1 flex flex-col p-6 border rounded-[4px] text-left transition-all ${
                        baselineMethod === 'compound'
                          ? 'border-[#005f9e] bg-[#f9fbfd] ring-1 ring-[#005f9e]/20'
                          : 'border-[#d0d0d7] hover:border-[#aeaeb6] bg-[#f3f3f7]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <Globe className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Select a published compound</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        One-click selection of a pre-defined Horizontal + Vertical pair
                      </p>
                    </button>
                    
                    {/* Combine Option */}
                    <button
                      onClick={() => handleMethodSelect('combine')}
                      className={`flex-1 flex flex-col p-6 border rounded-[4px] text-left transition-all ${
                        baselineMethod === 'combine'
                          ? 'border-[#005f9e] bg-[#f9fbfd] ring-1 ring-[#005f9e]/20'
                          : 'border-[#d0d0d7] hover:border-[#aeaeb6] bg-[#f3f3f7]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <Layers className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Build by Combining Components</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        Manually pair a Horizontal and Vertical CRS separately
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: BUILD METHOD (D05A) */}
              {step === 'buildMethod' && (
                <div className="flex-1 flex flex-col overflow-hidden p-6">
                  <h3 className="text-[16px] font-bold text-[#363545] mb-2">How would you like to build your baseline?</h3>
                  <p className="text-[14px] text-[#6a6976] mb-6">
                    Select from existing published coordinate systems or define custom parameters. You can adjust local site settings and calibration in the next step.
                  </p>
                  
                  <div className="flex gap-6">
                    {/* Build from existing Option */}
                    <button
                      onClick={() => handleBuildMethodSelect('existing')}
                      className={`flex-1 flex flex-col p-6 border rounded-[4px] text-left transition-all ${
                        buildMethod === 'existing'
                          ? 'border-[#005f9e] bg-[#f9fbfd] ring-1 ring-[#005f9e]/20'
                          : 'border-[#d0d0d7] hover:border-[#aeaeb6] bg-[#f3f3f7]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <Workflow className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Build from already existing vertical and horizontal CRS</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        Select from published horizontal and vertical coordinate systems, then combine them into a compound CRS.
                      </p>
                    </button>
                    
                    {/* Build custom Option */}
                    <button
                      onClick={() => handleBuildMethodSelect('custom')}
                      className={`flex-1 flex flex-col p-6 border rounded-[4px] text-left transition-all ${
                        buildMethod === 'custom'
                          ? 'border-[#005f9e] bg-[#f9fbfd] ring-1 ring-[#005f9e]/20'
                          : 'border-[#d0d0d7] hover:border-[#aeaeb6] bg-[#f3f3f7]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <Pencil className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Build custom horizontal and vertical</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        Manually pair a Horizontal and Vertical CRS separately
                      </p>
                    </button>
                  </div>
                </div>
              )}
              
              {/* STEP: HORIZONTAL METHOD SELECTION */}
              {step === 'horizontalMethod' && (
                <div className="flex-1 flex flex-col overflow-hidden p-6">
                  <h3 className="text-[16px] font-bold text-[#363545] mb-2">Select how you want to define your horizontal CRS component</h3>
                  <p className="text-[14px] text-[#6a6976] mb-6">
                    Choose how you would like to define the horizontal component of your coordinate reference system.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Published CRS Option */}
                    <button
                      onClick={() => handleHorizontalMethodSelect('published')}
                      className="flex flex-col p-5 border border-[#d0d0d7] rounded-[4px] text-left transition-all bg-[#f3f3f7] hover:border-[#aeaeb6] hover:bg-[#eaeaef]"
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <Globe className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Choose a Published Horizontal CRS</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        Select a published horizontal CRS from a list
                      </p>
                    </button>
                    
                    {/* Define via Parameters Option */}
                    <button
                      onClick={() => handleHorizontalMethodSelect('parameters')}
                      className="flex flex-col p-5 border border-[#d0d0d7] rounded-[4px] text-left transition-all bg-[#f3f3f7] hover:border-[#aeaeb6] hover:bg-[#eaeaef]"
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <Pencil className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Define via Parameters</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        Manually enter projection parameters (Transverse Mercator, Lambert, etc.) and datum details.
                      </p>
                    </button>
                    
                    {/* Upload Grid File Option */}
                    <button
                      onClick={() => handleHorizontalMethodSelect('file')}
                      className="flex flex-col p-5 border border-[#d0d0d7] rounded-[4px] text-left transition-all bg-[#f3f3f7] hover:border-[#aeaeb6] hover:bg-[#eaeaef]"
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <Upload className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Upload Grid File</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        Upload a Datum Grid File (DGF) or Shift Grid File (SGF) to define the horizontal transformation.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: DEFINE HORIZONTAL BY PARAMETERS */}
              {step === 'defineParameters' && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-[960px] mx-auto">
                    <h3 className="text-[16px] font-bold text-[#363545] mb-6">Define Horizontal CRS Parameters</h3>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">System Name</label>
                        <input
                          type="text"
                          value={horizontalParams.systemName}
                          onChange={(e) => setHorizontalParams(prev => ({ ...prev, systemName: e.target.value }))}
                          placeholder="Enter a name for your custom system"
                          className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">Projection Method</label>
                        <div className="relative">
                          <select
                            value={horizontalParams.projectionMethod}
                            onChange={(e) => setHorizontalParams(prev => ({ ...prev, projectionMethod: e.target.value }))}
                            className="w-full appearance-none border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 pr-10 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e] focus:ring-1 focus:ring-[#005f9e]"
                          >
                            <option>Transverse Mercator</option>
                            <option>Lambert Conformal Conic</option>
                            <option>UTM</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6976] pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">Reference Datum</label>
                        <div className="relative">
                          <select
                            value={horizontalParams.referenceDatum}
                            onChange={(e) => setHorizontalParams(prev => ({ ...prev, referenceDatum: e.target.value }))}
                            className="w-full appearance-none border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 pr-10 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e] focus:ring-1 focus:ring-[#005f9e]"
                          >
                            <option>WGS 84</option>
                            <option>NAD83</option>
                            <option>NAD27</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6976] pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">Central Meridian</label>
                          <input
                            type="text"
                            value={horizontalParams.centralMeridian}
                            onChange={(e) => setHorizontalParams(prev => ({ ...prev, centralMeridian: e.target.value }))}
                            className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">Latitude of Origin</label>
                          <input
                            type="text"
                            value={horizontalParams.latitudeOfOrigin}
                            onChange={(e) => setHorizontalParams(prev => ({ ...prev, latitudeOfOrigin: e.target.value }))}
                            className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">Scale Factor</label>
                          <input
                            type="text"
                            value={horizontalParams.scaleFactor}
                            onChange={(e) => setHorizontalParams(prev => ({ ...prev, scaleFactor: e.target.value }))}
                            className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">CRS Unit</label>
                          <div className="relative">
                            <select
                              value={selectedUnit}
                              onChange={(e) => setSelectedUnit(e.target.value)}
                              className="w-full appearance-none border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 pr-10 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e] focus:ring-1 focus:ring-[#005f9e]"
                            >
                              {UNIT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6976] pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">False Easting</label>
                          <input
                            type="text"
                            value={horizontalParams.falseEasting}
                            onChange={(e) => setHorizontalParams(prev => ({ ...prev, falseEasting: e.target.value }))}
                            className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#363545] mb-1.5">False Northing</label>
                          <input
                            type="text"
                            value={horizontalParams.falseNorthing}
                            onChange={(e) => setHorizontalParams(prev => ({ ...prev, falseNorthing: e.target.value }))}
                            className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2.5 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* STEP: DEFINE HORIZONTAL BY UPLOADING GRID FILE */}
              {step === 'uploadGridFile' && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-[860px] mx-auto">
                    <h3 className="text-[16px] font-bold text-[#363545] mb-6">Upload Horizontal Grid File</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] text-[#6a6976] mb-1 font-semibold">Custom System Name</label>
                        <input
                          type="text"
                          value={horizontalGridSystemName}
                          onChange={(e) => setHorizontalGridSystemName(e.target.value)}
                          placeholder="Enter a name for your custom system"
                          className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]"
                        />
                      </div>

                      <p className="text-[14px] text-[#363545]">
                        Upload a Datum Grid File (DGF) or Shift Grid File (SGF) to define the horizontal transformation.
                      </p>

                      <input
                        id="horizontal-grid-file-input"
                        type="file"
                        accept=".dgf,.sgf"
                        className="hidden"
                        onChange={(e) => handleHorizontalGridFileSelect(e.target.files?.[0] || null)}
                      />

                      <div
                        onClick={() => document.getElementById('horizontal-grid-file-input')?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsGridDropActive(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsGridDropActive(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsGridDropActive(false);
                          const file = e.dataTransfer.files?.[0] || null;
                          handleHorizontalGridFileSelect(file);
                        }}
                        className={`w-full border-2 border-dashed rounded-[2px] h-[180px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                          horizontalGridFile
                            ? 'border-[#005f9e] bg-[#e5f0f8]/30'
                            : isGridDropActive
                              ? 'border-[#005f9e] bg-[#f9f9fb]'
                              : 'border-[#d0d0d7] bg-white hover:bg-[#f9f9fb] hover:border-[#aeaeb6]'
                        }`}
                      >
                        {horizontalGridFile ? (
                          <>
                            <FileText className="w-10 h-10 text-[#005f9e] mb-4" strokeWidth={1.5} />
                            <p className="text-[16px] text-[#363545] font-bold mb-1">{horizontalGridFile.name}</p>
                            <p className="text-[12px] text-[#6a6976]">{(horizontalGridFile.size / 1024).toFixed(1)} KB</p>
                            <p className="text-[12px] text-[#005f9e] mt-4 hover:underline">Click to change file</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded bg-[#f3f3f7] border border-[#d0d0d7] flex items-center justify-center mb-4">
                              <Upload className="w-6 h-6 text-[#6a6976]" />
                            </div>
                            <div className="text-[16px] font-bold text-[#005f9e] mb-1">Click to browse DGF/SGF files</div>
                            <div className="text-[14px] text-[#6a6976]">or drag and drop here</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: VERTICAL METHOD SELECTION */}
              {step === 'verticalMethod' && (
                <div className="flex-1 flex flex-col overflow-hidden p-6">
                  <h3 className="text-[16px] font-bold text-[#363545] mb-2">Select how you want to define your vertical CRS component</h3>
                  <p className="text-[14px] text-[#6a6976] mb-5">
                    Choose a published vertical CRS or upload a custom geoid file for vertical definition.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => handleVerticalMethodSelect('published')}
                      className={`flex flex-col p-5 border rounded-[4px] text-left transition-all ${
                        verticalMethod === 'published'
                          ? 'border-[#005f9e] bg-[#f9fbfd] ring-1 ring-[#005f9e]/20'
                          : 'border-[#d0d0d7] hover:border-[#aeaeb6] bg-[#f3f3f7]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <FileText className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Choose a Published vertical CRS</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        Select a published vertical CRS from a list
                      </p>
                    </button>

                    <button
                      onClick={() => handleVerticalMethodSelect('customGeoid')}
                      className={`flex flex-col p-5 border rounded-[4px] text-left transition-all ${
                        verticalMethod === 'customGeoid'
                          ? 'border-[#005f9e] bg-[#f9fbfd] ring-1 ring-[#005f9e]/20'
                          : 'border-[#d0d0d7] hover:border-[#aeaeb6] bg-[#f3f3f7]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center mb-4">
                        <Upload className="w-5 h-5 text-[#6a6976]" />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#363545] mb-2">Upload Custom Geoid</h4>
                      <p className="text-[13px] text-[#6a6976]">
                        Upload a custom geoid file to define the vertical component of your coordinate system. Supported formats: .ggf, .bin, .xml
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: UPLOAD CUSTOM GEOID */}
              {step === 'uploadCustomGeoid' && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-[860px] mx-auto">
                    <h3 className="text-[16px] font-bold text-[#363545] mb-6">Upload Custom Geoid</h3>

                    <div className="space-y-4">
                      <p className="text-[14px] text-[#363545]">
                        Upload a custom geoid file to define the vertical component of your coordinate system. Supported formats: .ggf, .bin, .xml
                      </p>

                      <input
                        id="vertical-geoid-file-input"
                        type="file"
                        accept=".ggf,.bin,.xml"
                        className="hidden"
                        onChange={(e) => handleVerticalGeoidFileSelect(e.target.files?.[0] || null)}
                      />

                      <div
                        onClick={() => document.getElementById('vertical-geoid-file-input')?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsVerticalDropActive(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsVerticalDropActive(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsVerticalDropActive(false);
                          const file = e.dataTransfer.files?.[0] || null;
                          handleVerticalGeoidFileSelect(file);
                        }}
                        className={`w-full border-2 border-dashed rounded-[2px] h-[220px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                          verticalGeoidFile
                            ? 'border-[#005f9e] bg-[#e5f0f8]/30'
                            : isVerticalDropActive
                              ? 'border-[#005f9e] bg-[#f9f9fb]'
                              : 'border-[#d0d0d7] bg-white hover:bg-[#f9f9fb] hover:border-[#aeaeb6]'
                        }`}
                      >
                        {verticalGeoidFile ? (
                          <>
                            <FileText className="w-10 h-10 text-[#005f9e] mb-4" strokeWidth={1.5} />
                            <p className="text-[16px] text-[#363545] font-bold mb-1">{verticalGeoidFile.name}</p>
                            <p className="text-[12px] text-[#6a6976]">{(verticalGeoidFile.size / 1024).toFixed(1)} KB</p>
                            <p className="text-[12px] text-[#005f9e] mt-4 hover:underline">Click to change file</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded bg-[#f3f3f7] border border-[#d0d0d7] flex items-center justify-center mb-4">
                              <Upload className="w-6 h-6 text-[#6a6976]" />
                            </div>
                            <div className="text-[16px] font-bold text-[#005f9e] mb-1">Click to browse files</div>
                            <div className="text-[14px] text-[#6a6976]">or drag and drop here</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* STEP: SELECT HORIZONTAL (D06AA) */}
              {step === 'selectHorizontal' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-[2.5rem] py-4 bg-white border-b border-[#d0d0d7] flex-shrink-0">
                    <h3 className="text-[16px] font-bold text-[#363545] mb-2">Select your horizontal CRS</h3>
                    <p className="text-[14px] text-[#6a6976] mb-4">
                      Choose a horizontal coordinate system that defines positions on Earth's surface. This will determine how X and Y coordinates are calculated for your project.
                    </p>
                    
                    <CRSFilterBar 
                      searchQuery={crsSearchQuery}
                      onSearchChange={setCrsSearchQuery}
                      hasLocation={hasLocation}
                      filterByLocation={filterCRSByLocation}
                      onLocationFilterToggle={setFilterCRSByLocation}
                      unitFilter={crsUnitFilter}
                      onUnitFilterChange={setCrsUnitFilter}
                      layout="buttons-right"
                    />
                  </div>
                  
                  <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    <CRSTable 
                      items={horizontalFilteredItems.slice(0, 100)} 
                      selectedItem={builderHorizontal}
                      onSelect={handleHorizontalSelect}
                      sortConfig={horizontalSortConfig}
                      onSort={handleHorizontalSort}
                      variant="horizontal"
                      emptyMessage={crsSearchQuery ? 'No results found matching your search.' : 
                        filterCRSByLocation && hasLocation ? 'No horizontal CRS found for this location.' : 'No horizontal CRS found'}
                    />
                  </div>
                </div>
              )}
              
              {/* STEP: SELECT VERTICAL (D07AA) */}
              {step === 'selectVertical' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-[2.5rem] py-4 bg-white border-b border-[#d0d0d7] flex-shrink-0">
                    <h3 className="text-[16px] font-bold text-[#363545] mb-2">Select your Vertical CRS</h3>
                    <p className="text-[14px] text-[#6a6976] mb-4">
                      Choose a vertical coordinate system that defines elevation measurements. This determines how height or depth values are calculated relative to a reference surface.
                    </p>
                    
                    <CRSFilterBar 
                      searchQuery={crsSearchQuery}
                      onSearchChange={setCrsSearchQuery}
                      hasLocation={hasLocation}
                      filterByLocation={filterCRSByLocation}
                      onLocationFilterToggle={setFilterCRSByLocation}
                      unitFilter={crsUnitFilter}
                      onUnitFilterChange={setCrsUnitFilter}
                      layout="buttons-right"
                    />
                  </div>
                  
                  <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    <CRSTable 
                      items={verticalFilteredItems.slice(0, 100)} 
                      selectedItem={builderVertical}
                      onSelect={handleVerticalSelect}
                      sortConfig={verticalSortConfig}
                      onSort={handleVerticalSort}
                      variant="vertical"
                      emptyMessage={crsSearchQuery ? 'No results found matching your search.' : 
                        filterCRSByLocation && hasLocation ? 'No vertical CRS found for this location.' : 'No vertical CRS found'}
                    />
                  </div>
                </div>
              )}
              
              {/* STEP: COMBINE (D06AB) */}
              {step === 'combine' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <CombineCRSSelector 
                    allData={crsData}
                    horizontalCRS={builderHorizontal}
                    verticalCRS={builderVertical}
                    onSelectHorizontal={handleHorizontalSelect}
                    onSelectVertical={setBuilderVertical}
                    location={location}
                    serverLocation={serverLocation}
                    selectedUnit={selectedUnit}
                    onUnitChange={setSelectedUnit}
                  />
                </div>
              )}

              {/* STEP: SELECTION (D05B - for compound path only) */}
              {step === 'selection' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-[2.5rem] py-4 bg-white border-b border-[#d0d0d7] flex-shrink-0">
                    <h3 className="text-[16px] font-bold text-[#363545] mb-2">Select a published compound CRS</h3>
                    <p className="text-[14px] text-[#6a6976] mb-4">
                      Choose a pre-configured compound coordinate system that includes both horizontal and vertical components. These are officially published and widely used in specific regions.
                    </p>
                    
                    <CRSFilterBar 
                      searchQuery={crsSearchQuery}
                      onSearchChange={setCrsSearchQuery}
                      hasLocation={hasLocation}
                      filterByLocation={filterCRSByLocation}
                      onLocationFilterToggle={setFilterCRSByLocation}
                      unitFilter={crsUnitFilter}
                      onUnitFilterChange={setCrsUnitFilter}
                      layout="buttons-right"
                    />
                  </div>
                  
                  <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    <CRSTable 
                      items={filteredAndSortedItems.slice(0, 100)} 
                      selectedItem={selectedCompound}
                      onSelect={handleCompoundSelect}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      variant="compound"
                      emptyMessage={crsSearchQuery ? 'No results found matching your search.' : 
                        filterCRSByLocation ? 'No components found for this location.' : 'No official compound coordinate systems found for this region.'}
                    />
                  </div>
                </div>
              )}

              {/* STEP: MAIN EDIT (Main_edit) */}
              {step === 'mainEdit' && (
                <div className="flex-1 overflow-hidden flex">
                  <div className="flex-1 relative">
                    <CRSPreviewPanel
                      selectedCRS={null}
                      horizontalCRS={horizontalCRS}
                      verticalCRS={verticalCRS}
                      boundaryPoints={boundaryPoints}
                      locationMarker={searchMarker ? { name: 'Project Location', ...searchMarker } : null}
                      viewState={previewViewState}
                      mapType="s"
                      showEditButton={buildMethod !== 'custom'}
                      onEditCRS={() => {
                        if (baselineMethod === 'compound') {
                          setStep('selection');
                        } else if (buildMethod === 'existing') {
                          setStep('selectHorizontal');
                        } else {
                          setStep('combine');
                        }
                      }}
                      showIndividualCRSEdit={buildMethod === 'custom'}
                      onEditHorizontal={() => setShowHorizontalEditDialog(true)}
                      onEditVertical={() => setShowVerticalEditDialog(true)}
                      showUnitSelector={true}
                      selectedUnit={selectedUnit}
                      onUnitChange={setSelectedUnit}
                      showLocalSiteSection={true}
                      localSiteSettings={localSiteSettings}
                      calibrationSettings={calibrationSettings}
                      onEditLocalSite={() => setShowLocalSiteDialog(true)}
                      onEditCalibration={() => setShowCalibrationDialog(true)}
                      showTitle={true}
                      title={baselineMethod === 'compound' ? 'Selected 1 published compound' : 'Add your CRS coordinates'}
                      showFooterButtons={true}
                      onBack={handleBack}
                      onNext={handleMainEditNext}
                      nextLabel="Next"
                      canProceed={true}
                    />
                    
                    {/* Local Site Settings Slide Panel */}
                    {showLocalSiteDialog && (
                      <div className="absolute left-0 top-0 bottom-0 w-[400px] bg-white border-r border-[#d0d0d7] z-20 flex flex-col">
                        <div className="px-6 py-6 border-b border-[#d0d0d7]">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setShowLocalSiteDialog(false)} className="text-[#363545] hover:text-black">
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-[16px] font-bold text-[#363545] m-0">Local Site Settings</h3>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          <div className="p-6">
                            <p className="text-[13px] text-[#6a6976] mb-6">
                              Configure local site parameters to adjust the coordinate system for your specific project location. These settings apply scale factors and offsets to improve accuracy within your work area.
                            </p>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Project Latitude</label>
                                <input 
                                  type="text" 
                                  id="localsite-lat"
                                  defaultValue={localSiteSettings?.latitude || "40.5853° N"}
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Project Height</label>
                                <input 
                                  type="text" 
                                  id="localsite-height"
                                  defaultValue={localSiteSettings?.height?.split(' ')[0] || "4950.2"}
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Project Longitude</label>
                                <input 
                                  type="text" 
                                  id="localsite-lng"
                                  defaultValue={localSiteSettings?.longitude || "105.0844° W"}
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Ground Scale Factor</label>
                                <input 
                                  type="text" 
                                  id="localsite-scale"
                                  defaultValue={localSiteSettings?.scaleFactor || "0.99997"}
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                              
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
                          <button 
                            onClick={() => setShowLocalSiteDialog(false)}
                            className="px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7]"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              const lat = (document.getElementById('localsite-lat') as HTMLInputElement)?.value || '';
                              const height = (document.getElementById('localsite-height') as HTMLInputElement)?.value || '';
                              const lng = (document.getElementById('localsite-lng') as HTMLInputElement)?.value || '';
                              const scale = (document.getElementById('localsite-scale') as HTMLInputElement)?.value || '';

                              const defaults = {
                                latitude: "40.5853° N",
                                longitude: "105.0844° W",
                                height: "4950.2",
                                scaleFactor: "0.99997",
                              };

                              const settings: Record<string, string> = {};
                              if (lat !== defaults.latitude) settings.latitude = lat;
                              if (lng !== defaults.longitude) settings.longitude = lng;
                              if (height !== defaults.height) settings.height = `${height} ${selectedUnit}`;
                              if (scale !== defaults.scaleFactor) settings.scaleFactor = scale;

                              const DEFAULT_OFFSET = `0.000 ${selectedUnit}`;
                              setLocalSiteSettings((prev) => {
                                if (Object.keys(settings).length === 0) {
                                  return prev ?? null;
                                }
                                const base = prev ?? {
                                  latitude: defaults.latitude,
                                  longitude: defaults.longitude,
                                  height: `${defaults.height} ${selectedUnit}`,
                                  scaleFactor: defaults.scaleFactor,
                                  northingOffset: DEFAULT_OFFSET,
                                  eastingOffset: DEFAULT_OFFSET,
                                };
                                return {
                                  ...base,
                                  ...settings,
                                  northingOffset: prev?.northingOffset ?? base.northingOffset,
                                  eastingOffset: prev?.eastingOffset ?? base.eastingOffset,
                                };
                              });

                              setShowLocalSiteDialog(false);
                            }}
                            className="px-6 py-2 text-[14px] font-bold text-white bg-[#005f9e] hover:bg-[#00437b] rounded-[2px]"
                          >
                            Ok
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Site Calibration Slide Panel */}
                    {showCalibrationDialog && (
                      <div className="absolute left-0 top-0 bottom-0 w-[400px] bg-white border-r border-[#d0d0d7] z-20 flex flex-col">
                        <div className="px-6 py-6 border-b border-[#d0d0d7]">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setShowCalibrationDialog(false)} className="text-[#363545] hover:text-black">
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-[16px] font-bold text-[#363545] m-0">Site Calibration</h3>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          <div className="p-6">
                            <p className="text-[13px] text-[#6a6976] mb-6">
                              Adjust calibration settings for your site
                            </p>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Horizontal Calibration</label>
                                <input 
                                  type="text" 
                                  id="calibration-hz"
                                  defaultValue={calibrationSettings?.horizontal || "0.000"}
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Vertical Calibration</label>
                                <input 
                                  type="text" 
                                  id="calibration-vt"
                                  defaultValue={calibrationSettings?.vertical || "0.000"}
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
                          <button 
                            onClick={() => setShowCalibrationDialog(false)}
                            className="px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7]"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              // Get values from inputs
                              const hz = (document.getElementById('calibration-hz') as HTMLInputElement)?.value || '';
                              const vt = (document.getElementById('calibration-vt') as HTMLInputElement)?.value || '';
                              
                              // Default values
                              const defaults = {
                                horizontal: "0.000",
                                vertical: "0.000"
                              };
                              
                              // Only save fields that differ from defaults
                              const settings: any = {};
                              if (hz !== defaults.horizontal) settings.horizontal = `${hz} ${selectedUnit}`;
                              if (vt !== defaults.vertical) settings.vertical = `${vt} ${selectedUnit}`;
                              
                              // Only set if there are changes
                              setCalibrationSettings(Object.keys(settings).length > 0 ? settings : null);
                              
                              setShowCalibrationDialog(false);
                            }}
                            className="px-6 py-2 text-[14px] font-bold text-white bg-[#005f9e] hover:bg-[#00437b] rounded-[2px]"
                          >
                            Ok
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Horizontal CRS Edit Slide Panel */}
                    {showHorizontalEditDialog && (
                      <div className="absolute left-0 top-0 bottom-0 w-[400px] bg-white border-r border-[#d0d0d7] z-20 flex flex-col">
                        <div className="px-6 py-6 border-b border-[#d0d0d7]">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setShowHorizontalEditDialog(false)} className="text-[#363545] hover:text-black">
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-[16px] font-bold text-[#363545] m-0">Define Horizontal CRS</h3>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          <div className="p-6">
                            <p className="text-[13px] text-[#6a6976] mb-6">
                              Define your horizontal coordinate system by entering projection parameters or uploading a grid file for datum transformation.
                            </p>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">System Name</label>
                                <input 
                                  type="text" 
                                  id="hz-system-name"
                                  placeholder="Enter name"
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Projection Method</label>
                                <div className="relative">
                                  <select 
                                    id="hz-projection"
                                    className="w-full appearance-none border border-[#d0d0d7] rounded-[2px] px-3 py-2 pr-10 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e] focus:ring-1 focus:ring-[#005f9e]"
                                  >
                                    <option>Transverse Mercator</option>
                                    <option>Lambert Conformal Conic</option>
                                    <option>UTM</option>
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6976] pointer-events-none" />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Reference Datum</label>
                                <div className="relative">
                                  <select 
                                    id="hz-datum"
                                    className="w-full appearance-none border border-[#d0d0d7] rounded-[2px] px-3 py-2 pr-10 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e] focus:ring-1 focus:ring-[#005f9e]"
                                  >
                                    <option>WGS 84</option>
                                    <option>NAD83</option>
                                    <option>NAD27</option>
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6976] pointer-events-none" />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Central Meridian</label>
                                <input 
                                  type="text" 
                                  id="hz-meridian"
                                  placeholder="0.000"
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[13px] font-semibold text-[#363545] mb-1">Latitude of Origin</label>
                                <input 
                                  type="text" 
                                  id="hz-lat-origin"
                                  placeholder="0.000"
                                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e]"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-[#d0d0d7]">
                              <h4 className="text-[14px] font-bold text-[#363545] mb-3">Upload Grid File</h4>
                              <p className="text-[13px] text-[#6a6976] mb-4">
                                Upload a Datum Grid File (DGF) or Shift Grid File (SGF) to define the horizontal transformation.
                              </p>
                              
                              <input 
                                type="file" 
                                id="hz-grid-file-input"
                                className="hidden" 
                                accept=".dgf,.sgf" 
                              />
                              
                              <button
                                onClick={() => document.getElementById('hz-grid-file-input')?.click()}
                                className="w-full border-2 border-dashed border-[#d0d0d7] rounded-[2px] p-4 flex items-center justify-center gap-2 text-[#005f9e] hover:bg-[#f9f9fb] hover:border-[#aeaeb6] transition-colors"
                              >
                                <Upload className="w-5 h-5" />
                                <span className="text-[14px] font-semibold">Upload Grid File</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
                          <button 
                            onClick={() => setShowHorizontalEditDialog(false)}
                            className="px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7]"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              const name = (document.getElementById('hz-system-name') as HTMLInputElement)?.value || 'Custom Horizontal CRS';
                              const projection = (document.getElementById('hz-projection') as HTMLSelectElement)?.value || 'Transverse Mercator';
                              const datum = (document.getElementById('hz-datum') as HTMLSelectElement)?.value || 'WGS 84';
                              
                              const newCRS: CRSItem = {
                                code: "Custom Params",
                                name: name,
                                area: "Project Location",
                                type: "Projected",
                                unit: "Meter",
                                latLong: "-",
                                projection: projection,
                                datum: datum
                              };
                              handleCustomHorizontalDefined(newCRS);
                            }}
                            className="px-6 py-2 text-[14px] font-bold text-white bg-[#005f9e] hover:bg-[#00437b] rounded-[2px]"
                          >
                            Ok
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Vertical CRS Edit Slide Panel */}
                    {showVerticalEditDialog && (
                      <div className="absolute left-0 top-0 bottom-0 w-[400px] bg-white border-r border-[#d0d0d7] z-20 flex flex-col">
                        <div className="px-6 py-6 border-b border-[#d0d0d7]">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setShowVerticalEditDialog(false)} className="text-[#363545] hover:text-black">
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-[16px] font-bold text-[#363545] m-0">Define Vertical CRS</h3>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          <div className="p-6">
                            <p className="text-[13px] text-[#6a6976] mb-6">
                              Upload a custom geoid file to define the vertical component of your coordinate system. Supported formats: .ggf, .bin, .xml
                            </p>
                            
                            <input 
                              type="file" 
                              id="vertical-file-input"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCustomVerticalDefined(file);
                              }}
                              className="hidden" 
                              accept=".ggf,.bin,.xml" 
                            />
                            
                            <div 
                              onClick={() => document.getElementById('vertical-file-input')?.click()}
                              className="border-2 border-dashed border-[#d0d0d7] rounded-[2px] h-[200px] flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-[#f9f9fb] hover:border-[#aeaeb6]"
                            >
                              <div className="w-12 h-12 rounded bg-[#f3f3f7] flex items-center justify-center mb-4 border border-[#d0d0d7]">
                                <Upload className="w-6 h-6 text-[#6a6976]" />
                              </div>
                              <div className="text-[16px] font-bold text-[#005f9e] mb-1">Click to browse files</div>
                              <div className="text-[14px] text-[#6a6976]">or drag and drop here</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
                          <button 
                            onClick={() => setShowVerticalEditDialog(false)}
                            className="px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP: CONFIRMATION */}
              {step === 'confirmation' && (
                <div className="flex-1 overflow-y-auto bg-white">
                  <CRSConfirmationStep
                    previousCRS={previousCRSInfo}
                    newCRS={newCRSInfo}
                    impacts={impacts}
                    requiresConfirmation={requiresConfirmation}
                    isConfirmed={confirmationChecked}
                    onConfirmChange={setConfirmationChecked}
                    onEditHorizontal={() => {
                      if (horizontalMethod === 'published') {
                        setStep('selectHorizontal');
                      } else if (horizontalMethod === 'parameters') {
                        setStep('defineParameters');
                      } else {
                        setStep('uploadGridFile');
                      }
                    }}
                    onEditVertical={() => setStep('verticalMethod')}
                  />
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer - Hide for mainEdit step */}
        {step !== 'mainEdit' && (
          <footer className="flex justify-end items-center gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb] flex-shrink-0">
          {step === 'method' && onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step !== 'method' && (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          
          {step === 'method' && (
            <button 
              onClick={handleMethodNext}
              className="flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white bg-[#005f9e] hover:bg-[#00437b] rounded-[2px]"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {step === 'buildMethod' && (
            <button 
              onClick={handleBuildMethodNext}
              className="flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white bg-[#005f9e] hover:bg-[#00437b] rounded-[2px]"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'defineParameters' && (
            <button 
              onClick={handleDefineParametersNext}
              className="flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white bg-[#005f9e] hover:bg-[#00437b] rounded-[2px]"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'uploadGridFile' && (
            <button 
              onClick={handleUploadGridNext}
              disabled={!horizontalGridSystemName.trim() || !horizontalGridFile}
              className={`flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white rounded-[2px] ${
                horizontalGridSystemName.trim() && horizontalGridFile
                  ? 'bg-[#005f9e] hover:bg-[#00437b]'
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'verticalMethod' && (
            <button 
              onClick={handleVerticalMethodNext}
              className="flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white bg-[#005f9e] hover:bg-[#00437b] rounded-[2px]"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'uploadCustomGeoid' && (
            <button 
              onClick={handleUploadCustomGeoidNext}
              disabled={!verticalGeoidFile}
              className={`flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white rounded-[2px] ${
                verticalGeoidFile
                  ? 'bg-[#005f9e] hover:bg-[#00437b]'
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {step === 'selectHorizontal' && (
            <button 
              onClick={handleHorizontalNext}
              disabled={!builderHorizontal}
              className={`flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white rounded-[2px] ${
                builderHorizontal
                  ? 'bg-[#005f9e] hover:bg-[#00437b]'
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {step === 'selectVertical' && (
            <button 
              onClick={handleVerticalNext}
              disabled={!builderVertical}
              className={`flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white rounded-[2px] ${
                builderVertical
                  ? 'bg-[#005f9e] hover:bg-[#00437b]'
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {step === 'combine' && (
            <button 
              onClick={handleCombineNext}
              disabled={!builderHorizontal || !builderVertical}
              className={`flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white rounded-[2px] ${
                (builderHorizontal && builderVertical)
                  ? 'bg-[#005f9e] hover:bg-[#00437b]'
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {step === 'selection' && (
            <button 
              onClick={handleSelectionNext}
              disabled={!canProceedFromSelection}
              className={`flex items-center gap-2 px-6 py-2 text-[14px] font-bold text-white rounded-[2px] ${
                canProceedFromSelection
                  ? 'bg-[#005f9e] hover:bg-[#00437b]'
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {step === 'confirmation' && (
            <button 
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`px-6 py-2 text-[14px] font-bold text-white rounded-[2px] ${
                canConfirm
                  ? 'bg-[#005f9e] hover:bg-[#00437b]'
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Apply changes
            </button>
          )}
        </footer>
        )}
      </div>
    </div>
  );
};

export default DefineCustomCRSDialog;
