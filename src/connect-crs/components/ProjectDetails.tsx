import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, 
  HardHat, 
  Database,
  ChevronDown,
  Users, 
  Folder, 
  FileText,
  HelpCircle,
  MapPin,
} from "lucide-react";

// Import Utils
import { project, unproject, formatLatForDisplay, formatLongForDisplay } from '../utils/geoUtils';

// Import Hooks
import { useBoundaryManager } from '../hooks/useBoundaryManager';

// Import Dialogs
import CRSFileSelectDialog from './dialogs/CRSFileSelectDialog';
import ImportFieldServiceDialog from './dialogs/ImportFieldServiceDialog';
import ImportParametersDialog from './dialogs/ImportParametersDialog';
import DefineCustomCRSDialog from './dialogs/DefineCustomCRSDialog';
import PublishedCRSDialog from './dialogs/PublishedCRSDialog';
import CRSWarningDialog from './dialogs/CRSWarningDialog';
import BoundaryInputDialog from './dialogs/BoundaryInputDialog';
import BoundaryFileSelectDialog from './dialogs/BoundaryFileSelectDialog';
import CRSHelpDialog from './dialogs/CRSHelpDialog';
import LocationPermissionsDialog from './dialogs/LocationPermissionsDialog';
import ProjectLocationBoundaryDialog from './dialogs/ProjectLocationBoundaryDialog';
import ProjectLocationDialog from './dialogs/ProjectLocationDialog';
import UnifiedCRSEntryDialog from './dialogs/UnifiedCRSEntryDialog';

// Import UI Sections
import MapEmptyNoData from './map/MapEmptyNoData';
import CRSDisplay from './CRSDisplay';

// Types
import type { CRSItem } from '../types';

type CRSSource = 'file' | 'field' | 'custom' | 'published';

const ProjectDetails: React.FC = () => {
  // --- STATE ---
  const [viewState, setViewState] = useState({ lat: 50, lng: 10, zoom: 4 });
  const [serverLocation, setServerLocation] = useState('Europe');
  const [searchMarker, setSearchMarker] = useState<{lat: number, lng: number} | null>(null);
  
  // Location & Boundary State (from dialog)
  const [projectLocation, setProjectLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [projectBoundaryPoints, setProjectBoundaryPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [projectMapType, setProjectMapType] = useState<string>('y'); // Store map type from dialog
  
  // Search state for main view
  const [searchQuery, setSearchQuery] = useState("");
  const [, setIsSearching] = useState(false);
  const [, setSearchError] = useState<string | null>(null);
  const [, setSearchResults] = useState<any[]>([]);
  const [, setAllSearchResults] = useState<any[]>([]);
  const [, setShowSearchResults] = useState(false);
  const [, setShowAllSearchResults] = useState(false);
  const [isMapSelectionMode, setIsMapSelectionMode] = useState(false);
  
  // Map panning state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartCenter, setDragStartCenter] = useState({ lat: 0, lng: 0 });
  
  // CRS State
  const [hasProjectedCRS, setHasProjectedCRS] = useState(false);
  
  // We now store the full CRS item object instead of just a name string.
  // This allows us to access details like Local Site parameters.
  const [activeProjectCRS, setActiveProjectCRS] = useState<CRSItem | null>(null);
  
  // Temporary state for the warning dialog confirmation flow
  const [pendingNewCRS] = useState<CRSItem | null>(null);
  const [pendingCRSSource] = useState<CRSSource | null>(null);
  
  const [crsViewMode, setCrsViewMode] = useState<'summary' | 'detailed'>('summary');
  const [crsDropdownOpen, setCrsDropdownOpen] = useState(false);
  const [, setBoundaryDropdownOpen] = useState(false);
  const [showLocationBoundaryDialog, setShowLocationBoundaryDialog] = useState(false);
  const [showProjectLocationDialog, setShowProjectLocationDialog] = useState(false);

  // Use Custom Hook for Boundary Logic
  const {
    boundaryPoints: _boundaryPoints,
    setBoundaryPoints: _setBoundaryPoints,
    previewBoundaryPoints: _previewBoundaryPoints,
    isDrawing,
    boundaryText: _boundaryText,
    coordinateFormat,
    boundaryInputValue,
    setBoundaryInputValue,
    showBoundaryDialog,
    setShowBoundaryDialog,
    showBoundaryFileSelectDialog,
    setShowBoundaryFileSelectDialog,
    startDrawing: _startDrawing,
    finishDrawing: _finishDrawing,
    cancelDrawing: _cancelDrawing,
    openBoundaryDialog,
    confirmBoundaryDialog,
    switchFormat,
    handleFileSelected
  } = useBoundaryManager({ setViewState, hasProjectedCRS });

  // Dialog Visibility State (Non-Boundary)
  const [showCRSFileSelectDialog, setShowCRSFileSelectDialog] = useState(false);
  const [showCRSWarningDialog, setShowCRSWarningDialog] = useState(false);
  const [showImportFieldServiceDialog, setShowImportFieldServiceDialog] = useState(false);
  const [showImportParametersDialog, setShowImportParametersDialog] = useState(false);
  const [showDefineCustomCRSDialog, setShowDefineCustomCRSDialog] = useState(false);
  const [showPublishedCRSDialog, setShowPublishedCRSDialog] = useState(false);
  const [showCRSHelpDialog, setShowCRSHelpDialog] = useState(false);
  const [showUnifiedCRSEntryDialog, setShowUnifiedCRSEntryDialog] = useState(false);
  
  // Permission Dialog State
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  // We don't need title state anymore as the component has the correct default, but we can pass it if needed.

  // Refs
  const crsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---

  // Handle outside clicks for CRS dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (crsRef.current && !crsRef.current.contains(event.target as Node)) {
        setCrsDropdownOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBoundaryDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS ---

  // Handle Server Location Change and Zoom Map
  const handleServerLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const location = e.target.value;
    setServerLocation(location);

    // Update map view based on selection
    switch (location) {
      case 'North America':
        setViewState({ lat: 45, lng: -100, zoom: 3 });
        break;
      case 'Europe':
        setViewState({ lat: 54, lng: 15, zoom: 3 });
        break;
      case 'Asia':
        setViewState({ lat: 34, lng: 100, zoom: 3 });
        break;
      case 'Australia':
        setViewState({ lat: -25, lng: 133, zoom: 4 });
        break;
      default:
        break;
    }
  };

  // CRS Confirmation Handlers
  // Direct CRS application (used by dialogs with built-in confirmation)
  const handleDirectCRSApply = (newCRS: CRSItem) => {
    setHasProjectedCRS(true);
    setActiveProjectCRS(newCRS);
  };

  const handleConfirmCRSChange = () => {
    if (pendingNewCRS) {
        setHasProjectedCRS(true);
        setActiveProjectCRS(pendingNewCRS);
    }
    setShowCRSWarningDialog(false);
  };

  const handleCRSBack = () => {
    setShowCRSWarningDialog(false);
    if (pendingCRSSource === 'file') setShowCRSFileSelectDialog(true);
    else if (pendingCRSSource === 'field') setShowImportFieldServiceDialog(true);
    else if (pendingCRSSource === 'custom') setShowDefineCustomCRSDialog(true);
    else if (pendingCRSSource === 'published') setShowPublishedCRSDialog(true);
  };

  // Handle path selection from unified entry dialog
  const handleCRSPathSelect = (path: 'published' | 'file' | 'field' | 'custom') => {
    switch (path) {
      case 'published':
        setShowPublishedCRSDialog(true);
        break;
      case 'file':
        setShowCRSFileSelectDialog(true);
        break;
      case 'field':
        setShowImportFieldServiceDialog(true);
        break;
      case 'custom':
        setShowDefineCustomCRSDialog(true);
        break;
    }
  };

  // Handle CRS edit button click - always show unified entry dialog
  const handleCRSEditClick = () => {
    setShowUnifiedCRSEntryDialog(true);
  };

  // Handle save from location/boundary dialog
  const handleLocationBoundarySave = (data: {
    location: { name: string; lat: number; lng: number } | null;
    boundaryPoints: { lat: number; lng: number }[];
    mapType: string;
  }) => {
    setProjectLocation(data.location);
    setProjectBoundaryPoints(data.boundaryPoints);
    setProjectMapType(data.mapType);
    
    // Update search query and marker if location was set
    if (data.location) {
      setSearchQuery(data.location.name);
      setSearchMarker({ lat: data.location.lat, lng: data.location.lng });
    } else {
      setSearchMarker(null);
    }
    
    // Calculate optimal view state for thumbnail
    if (data.boundaryPoints.length >= 2) {
      // Fit to boundary
      const lats = data.boundaryPoints.map(p => p.lat);
      const lngs = data.boundaryPoints.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      // Thumbnail dimensions (approximate)
      const thumbnailWidth = 280;
      const thumbnailHeight = 175;
      
      // Calculate zoom to fit boundary using actual projection
      const calculateZoomToFit = () => {
        for (let z = 18; z >= 2; z--) {
          const sw = project(minLat, minLng, z);
          const ne = project(maxLat, maxLng, z);
          const boundsWidth = Math.abs(ne.x - sw.x);
          const boundsHeight = Math.abs(sw.y - ne.y);
          
          // Check if boundary fits within 80% of thumbnail (with padding)
          if (boundsWidth <= thumbnailWidth * 0.8 && boundsHeight <= thumbnailHeight * 0.8) {
            return z;
          }
        }
        return 2;
      };
      
      const bestZoom = calculateZoomToFit();
      setViewState({ lat: centerLat, lng: centerLng, zoom: bestZoom });
    } else if (data.location) {
      // Just location, zoom in nicely
      setViewState(prev => ({ ...prev, lat: data.location!.lat, lng: data.location!.lng, zoom: 14 }));
    }
  };

  // Handle save from project location dialog (location only)
  const handleProjectLocationSave = (location: { name: string; lat: number; lng: number } | null) => {
    setProjectLocation(location);
    
    if (location) {
      setSearchQuery(location.name);
      setSearchMarker({ lat: location.lat, lng: location.lng });
      setViewState(prev => ({ ...prev, lat: location.lat, lng: location.lng, zoom: 14 }));
    } else {
      setSearchMarker(null);
    }
  };

  // Reverse geocoding for getting location name from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        const primaryLocation = address.city || 
                               address.town || 
                               address.village || 
                               address.county || 
                               address.state || 
                               address.region;
        
        const country = address.country;
        
        if (primaryLocation && country) {
          return `${primaryLocation}, ${country}`;
        } else if (country) {
          return country;
        } else if (primaryLocation) {
          return primaryLocation;
        }
        
        return null;
      }
      return null;
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return null;
    }
  };

  // Autocomplete search as user types
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setAllSearchResults([]);
      setShowSearchResults(false);
      setShowAllSearchResults(false);
      setSearchError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      setShowAllSearchResults(false);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=20`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setSearchResults(data.slice(0, 2)); // Show only first 2 results
          setAllSearchResults(data);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setAllSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (err) {
        setSearchError("Search failed");
        setSearchResults([]);
        setAllSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle map type change
  const handleMapTypeChange = (newMapType: string) => {
    setProjectMapType(newMapType);
  };

  // Handle zoom change
  const handleZoomChange = (delta: number) => {
    setViewState(prev => ({ 
      ...prev, 
      zoom: Math.min(Math.max(prev.zoom + delta, 2), 20) 
    }));
  };

  // Handle map click for location selection
  const handleMapClickForLocation = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMapSelectionMode) return;
    
    const mapElement = e.currentTarget;
    const rect = mapElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert pixel coordinates to geographic coordinates
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    const worldX = centerPoint.x - (rect.width / 2) + x;
    const worldY = centerPoint.y - (rect.height / 2) + y;
    const geo = unproject(worldX, worldY, viewState.zoom);
    
    // Set the location marker
    setProjectLocation({ name: "", lat: geo.lat, lng: geo.lng });
    setSearchMarker({ lat: geo.lat, lng: geo.lng });
    setViewState(prev => ({ ...prev, lat: geo.lat, lng: geo.lng }));
    setIsMapSelectionMode(false);
    
    // Show loading state
    setIsSearching(true);
    
    // Try to get place name via reverse geocoding
    const placeName = await reverseGeocode(geo.lat, geo.lng);
    
    if (placeName) {
      setSearchQuery(placeName);
      setProjectLocation({ name: placeName, lat: geo.lat, lng: geo.lng });
    } else {
      const coordStr = `${formatLatForDisplay(geo.lat)}, ${formatLongForDisplay(geo.lng)}`;
      setSearchQuery(coordStr);
      setProjectLocation({ name: coordStr, lat: geo.lat, lng: geo.lng });
    }
    
    setIsSearching(false);
  };

  // Map panning handlers
  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't start panning if clicking on buttons or in selection mode
    if ((e.target as HTMLElement).closest('button') || isMapSelectionMode) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartCenter({ lat: viewState.lat, lng: viewState.lng });
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const centerPoint = project(dragStartCenter.lat, dragStartCenter.lng, viewState.zoom);
    const newCenterWorld = { x: centerPoint.x - dx, y: centerPoint.y - dy };
    const newCenterGeo = unproject(newCenterWorld.x, newCenterWorld.y, viewState.zoom);
    setViewState(prev => ({ ...prev, lat: newCenterGeo.lat, lng: newCenterGeo.lng }));
  };

  const handleMapMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    
    // Handle location selection click only if we didn't drag
    if (isMapSelectionMode) {
      const dist = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
      if (dist < 5) {
        handleMapClickForLocation(e);
      }
    }
  };

  const handleMapMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f3f7] overflow-y-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#f3f3f7]">
        <h1 className="text-[24px] text-[#363545] font-normal">Project Details</h1>
        <button className="bg-[#005f9e] hover:bg-[#00437b] text-white text-[14px] font-semibold py-2 px-4 rounded-[2px]">Save changes</button>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN - Overview / Stats / Ownership */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[#d0d0d7] rounded-[2px] shadow-sm p-6">
            <h2 className="text-[16px] font-bold text-[#363545] mb-4">Overview</h2>
            <div className="mb-4">
              <label className="block text-[12px] text-[#6a6976] mb-1">Name</label>
              <input type="text" defaultValue="UI-UX investigation" className="w-full border border-[#d0d0d7] focus:border-[#005f9e] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none bg-white" />
            </div>
            <div className="mb-4">
              <label className="block text-[12px] text-[#6a6976] mb-2">Project thumbnail</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#f3f3f7] border border-[#d0d0d7] rounded-[2px] flex items-center justify-center"><HardHat className="w-8 h-8 text-[#aeaeb6]" /></div>
                <button className="text-[#005f9e] text-[14px] font-semibold hover:underline">Upload new</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[12px] text-[#6a6976] mb-1">Project Server location.(Dropdown only for UI-Testing - Not be implemented)</label>
              <div className="relative">
                <select value={serverLocation} onChange={handleServerLocationChange} className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none appearance-none bg-white focus:border-[#005f9e]">
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="Australia">Australia</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-[#6a6976] pointer-events-none" />
              </div>
            </div>
            <div className="mb-4"><label className="block text-[12px] text-[#6a6976] mb-1">Created</label><div className="text-[14px] text-[#363545]">Sep 11, 2025 04:47 AM By ErlingTronsmoen</div></div>
            <div><label className="block text-[12px] text-[#6a6976] mb-1">Last modified</label><div className="text-[14px] text-[#363545]">Oct 27, 2025 04:07 AM By ErlingTronsmoen</div></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
             <div className="flex-1 bg-white border border-[#d0d0d7] rounded-[2px] shadow-sm p-6">
               <h2 className="text-[16px] font-bold text-[#363545] mb-4">Storage</h2>
               <div className="flex justify-between items-center text-center">
                 <div className="flex flex-col items-center"><div className="flex items-center gap-1 text-[12px] text-[#6a6976] mb-1"><Database className="w-3 h-3" /> Size</div><div className="text-[14px] font-semibold text-[#363545]">0 B</div></div>
                 <div className="flex flex-col items-center"><div className="flex items-center gap-1 text-[12px] text-[#6a6976] mb-1"><Folder className="w-3 h-3" /> Folders</div><div className="text-[14px] font-semibold text-[#363545]">1</div></div>
                 <div className="flex flex-col items-center"><div className="flex items-center gap-1 text-[12px] text-[#6a6976] mb-1"><FileText className="w-3 h-3" /> Files</div><div className="text-[14px] font-semibold text-[#363545]">0</div></div>
               </div>
             </div>
             <div className="w-full sm:w-[140px] bg-white border border-[#d0d0d7] rounded-[2px] shadow-sm p-6 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-[16px] text-[#363545] font-bold mb-1"><Users className="w-4 h-4" /> Users</div>
                <div className="text-[20px] font-normal text-[#363545]">1</div>
             </div>
          </div>

          <div className="bg-white border border-[#d0d0d7] rounded-[2px] shadow-sm p-6">
            <h2 className="text-[16px] font-bold text-[#363545] mb-4">Project ownership</h2>
            <div className="mb-4">
              <label className="block text-[12px] text-[#6a6976] mb-1">Account</label>
              <div className="relative">
                <select className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none appearance-none bg-white">
                  <option>Test Licensed Mixed Account | TRMB</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-[#6a6976] pointer-events-none" />
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-[12px] text-[#6a6976] mb-1">Project license</label>
              <div className="text-[14px] text-[#363545]">Trimble Connect Innovate - Named User Subscription - Annual | BN1-SB-TCTR3-EC-A</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Map & CRS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[#d0d0d7] rounded-[2px] shadow-sm p-6 overflow-visible">
            <div className="mb-4">
              <h2 className="text-[16px] font-bold text-[#363545] m-0">Project Location & CRS</h2>
            </div>

            {/* PROJECT LOCATION SUBTITLE */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[14px] font-bold text-[#363545]">Project Location</h3>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowProjectLocationDialog(true);
                }}
                className="mr-3 -m-1.5 p-1.5 border-0 bg-transparent appearance-none rounded-[2px] text-[#6a6976] hover:text-[#363545] hover:bg-[#eaeaef] transition-colors"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </div>
            {projectLocation ? (
              <div className="flex items-start gap-2 mb-4 pr-10">
                <MapPin className="w-4 h-4 text-[#6a6976] flex-shrink-0 mt-0.5" />
                <p className="text-[14px] text-[#6a6976] break-words">{projectLocation.name}</p>
              </div>
            ) : (
              <p className="text-[14px] text-[#6a6976] mb-4">No project location has been defined.</p>
            )}

            {/* BOUNDARY SECTION - Moved above the map */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[14px] font-bold text-[#363545]">Boundary</h3>
                <button 
                  type="button"
                  onClick={() => !isDrawing && setShowLocationBoundaryDialog(true)}
                  className={`mr-3 -m-1.5 p-1.5 border-0 bg-transparent appearance-none rounded-[2px] text-[#6a6976] hover:text-[#363545] hover:bg-[#eaeaef] transition-colors ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDrawing}
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
              {projectBoundaryPoints.length > 0 ? (
                <div className="flex items-center gap-2">
                  <img src="/icons/PhPolygon.svg" alt="" className="w-4 h-4 flex-shrink-0" style={{ filter: 'invert(44%) sepia(6%) saturate(435%) hue-rotate(215deg) brightness(94%) contrast(87%)' }} />
                  <p className="text-[14px] text-[#6a6976]">{projectBoundaryPoints.length} points defined</p>
                </div>
              ) : (
                <p className="text-[14px] text-[#6a6976]">No boundary has been defined.</p>
              )}
            </div>

            {/* MAP COMPONENT */}
            <div className="mb-4 relative">
              <MapEmptyNoData 
                viewState={viewState} 
                onClick={() => {}}
                disabled={false}
                boundaryPoints={projectBoundaryPoints}
                locationMarker={projectLocation}
                mapType={projectMapType}
                showCRSColumn={hasProjectedCRS}
                showControls={true}
                onMapTypeChange={handleMapTypeChange}
                onZoomChange={handleZoomChange}
                onMapClick={handleMapClickForLocation}
                isSelectionMode={isMapSelectionMode}
                onMouseDown={handleMapMouseDown}
                onMouseMove={handleMapMouseMove}
                onMouseUp={handleMapMouseUp}
                onMouseLeave={handleMapMouseLeave}
                isDragging={isDragging}
              />
            </div>

            <div className="h-px bg-[#d0d0d7] my-4"></div>

            {/* CRS SECTION */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-bold text-[#363545] m-0">Coordinate Reference System - CRS</h2>
                  <button 
                    onClick={() => setShowCRSHelpDialog(true)}
                    className="text-[#6a6976] hover:text-[#363545] cursor-pointer"
                    title="Why use a CRS?"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative" ref={crsRef}>
                  <button onClick={handleCRSEditClick} className="mr-3 -m-1.5 p-1.5 border-0 bg-transparent appearance-none rounded-[2px] text-[#6a6976] hover:text-[#363545] hover:bg-[#eaeaef] transition-colors">
                    <Pencil className="w-5 h-5" />
                  </button>
                  {crsDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-[340px] bg-white border border-[#d0d0d7] shadow-lg rounded-[2px] z-50 py-2">
                      <button onClick={() => { setCrsDropdownOpen(false); setShowPublishedCRSDialog(true); }} className="w-full text-left px-4 py-2 text-[14px] text-[#363545] hover:bg-[#eaeaef]">Choose published CRS</button>
                      <button onClick={() => { setCrsDropdownOpen(false); setShowCRSFileSelectDialog(true); }} className="w-full text-left px-4 py-2 text-[14px] text-[#363545] hover:bg-[#eaeaef]">CRS from file</button>
                      <button onClick={() => { setCrsDropdownOpen(false); setShowImportFieldServiceDialog(true); }} className="w-full text-left px-4 py-2 text-[14px] text-[#363545] hover:bg-[#eaeaef]">Import CRS from Field Service</button>
                      <button onClick={() => { setCrsDropdownOpen(false); setShowDefineCustomCRSDialog(true); }} className="w-full text-left px-4 py-2 text-[14px] text-[#363545] hover:bg-[#eaeaef]">Define custom CRS</button>
                    </div>
                  )}
                </div>
              </div>
              <CRSDisplay 
                hasProjectedCRS={hasProjectedCRS}
                activeCRS={activeProjectCRS}
                viewMode={crsViewMode}
                onViewModeChange={setCrsViewMode}
                onEditCRS={handleCRSEditClick}
                onUpdateLocalSite={(localSite) => {
                  if (activeProjectCRS) {
                    setActiveProjectCRS({
                      ...activeProjectCRS,
                      localSite
                    });
                  }
                }}
                onUpdateCalibration={(calibration) => {
                  if (activeProjectCRS) {
                    setActiveProjectCRS({
                      ...activeProjectCRS,
                      calibration
                    });
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="bg-white border border-[#d0d0d7] hover:bg-[#f3f3f7] text-[#363545] text-[14px] font-semibold py-2 px-4 rounded-[2px]">Leave project</button>
             <button className="bg-[#a51d25] hover:bg-[#8a181f] text-white text-[14px] font-semibold py-2 px-4 rounded-[2px]">Delete project</button>
          </div>
        </div>
      </div>

      {/* --- ALL DIALOGS --- */}
      <CRSFileSelectDialog 
        isOpen={showCRSFileSelectDialog} 
        onClose={() => setShowCRSFileSelectDialog(false)} 
        onBack={() => {
          setShowCRSFileSelectDialog(false);
          setShowUnifiedCRSEntryDialog(true);
        }}
        onConfirm={(_file, crsItem) => {
           setShowCRSFileSelectDialog(false);
           handleDirectCRSApply(crsItem);
        }}
        boundaryPoints={projectBoundaryPoints}
        viewState={viewState}
        currentCRS={activeProjectCRS}
      />

      <ImportFieldServiceDialog 
        isOpen={showImportFieldServiceDialog} 
        onClose={() => setShowImportFieldServiceDialog(false)}
        onBack={() => {
          setShowImportFieldServiceDialog(false);
          setShowUnifiedCRSEntryDialog(true);
        }}
        onConfirm={(jobName) => {
           setShowImportFieldServiceDialog(false);
           // Construct a pseudo CRS item from the imported job
           const jobCRS: CRSItem = {
              code: "Field-Import",
              name: `${jobName} (Field Service)`,
              area: "Field Site",
              type: "Compound",
              unit: "Meter",
              latLong: "-",
              projection: "Transverse Mercator",
              datum: "NAD83 (2011)",
              verticalDatum: "NAVD88",
              localSite: {
                 projectLatitude: "40.5853° N",
                 projectLongitude: "105.0844° W",
                 projectHeight: "1540.250 m",
                 groundScaleFactor: "0.999984",
                 northingOffset: "0.000",
                 eastingOffset: "0.000"
              }
           };
           handleDirectCRSApply(jobCRS);
        }}
        onOpenImportSettings={() => { setShowImportFieldServiceDialog(false); setShowImportParametersDialog(true); }}
        projectLocation={projectLocation}
        currentCRS={activeProjectCRS ? {
          name: activeProjectCRS.name,
          datum: activeProjectCRS.datum || '',
          verticalDatum: activeProjectCRS.verticalDatum || '',
          hasLocalSite: !!activeProjectCRS.localSite
        } : null}
      />

      <ImportParametersDialog 
        isOpen={showImportParametersDialog} 
        onClose={() => setShowImportParametersDialog(false)} 
        onConfirm={() => setShowImportParametersDialog(false)} 
      />

      <DefineCustomCRSDialog 
        isOpen={showDefineCustomCRSDialog} 
        onClose={() => setShowDefineCustomCRSDialog(false)}
        onBack={() => {
          setShowDefineCustomCRSDialog(false);
          setShowUnifiedCRSEntryDialog(true);
        }}
        viewState={viewState}
        serverLocation={serverLocation}
        searchMarker={searchMarker}
        boundaryPoints={projectBoundaryPoints}
        currentCRS={activeProjectCRS}
        onConfirm={(customCRS) => {
           setShowDefineCustomCRSDialog(false);
           handleDirectCRSApply(customCRS);
        }} 
      />

      <PublishedCRSDialog 
        isOpen={showPublishedCRSDialog} 
        onClose={() => setShowPublishedCRSDialog(false)}
        onBack={() => {
          setShowPublishedCRSDialog(false);
          setShowUnifiedCRSEntryDialog(true);
        }}
        onConfirm={(publishedCRS) => {
           setShowPublishedCRSDialog(false);
           handleDirectCRSApply(publishedCRS);
        }}
        viewState={viewState}
        serverLocation={serverLocation}
        searchMarker={searchMarker}
        projectLocation={projectLocation}
        boundaryPoints={projectBoundaryPoints}
        currentCRS={activeProjectCRS}
      />

      <CRSWarningDialog 
        isOpen={showCRSWarningDialog} 
        onClose={() => setShowCRSWarningDialog(false)} 
        onConfirm={handleConfirmCRSChange} 
        onBack={handleCRSBack}
        currentCRS={activeProjectCRS ? activeProjectCRS.name : "No coordinate reference system defined."} 
        newCRS={pendingNewCRS ? pendingNewCRS.name : ""}
        currentCRSDetails={activeProjectCRS ? {
          name: activeProjectCRS.name,
          datum: activeProjectCRS.datum,
          verticalDatum: activeProjectCRS.verticalDatum,
          hasLocalSite: !!activeProjectCRS.localSite,
          hasCalibration: !!activeProjectCRS.calibration
        } : null}
        newCRSDetails={pendingNewCRS ? {
          name: pendingNewCRS.name,
          datum: pendingNewCRS.datum,
          verticalDatum: pendingNewCRS.verticalDatum,
          hasLocalSite: !!pendingNewCRS.localSite,
          hasCalibration: !!pendingNewCRS.calibration
        } : null}
      />

      <BoundaryInputDialog 
        isOpen={showBoundaryDialog}
        onClose={() => setShowBoundaryDialog(false)}
        onConfirm={confirmBoundaryDialog}
        value={boundaryInputValue}
        onChange={setBoundaryInputValue}
        coordinateFormat={coordinateFormat}
        onFormatChange={switchFormat}
        hasProjectedCRS={hasProjectedCRS}
      />

      <BoundaryFileSelectDialog 
        isOpen={showBoundaryFileSelectDialog}
        onClose={() => setShowBoundaryFileSelectDialog(false)}
        onFileSelected={handleFileSelected}
      />

      <CRSHelpDialog 
        isOpen={showCRSHelpDialog} 
        onClose={() => setShowCRSHelpDialog(false)} 
      />

      <LocationPermissionsDialog
        isOpen={showPermissionsDialog}
        onClose={() => setShowPermissionsDialog(false)}
        title="Project Location & CRS permissions"
      />

      <ProjectLocationDialog
        isOpen={showProjectLocationDialog}
        onClose={() => setShowProjectLocationDialog(false)}
        onSave={handleProjectLocationSave}
        initialLocation={projectLocation}
        initialViewState={viewState}
        initialMapType={projectMapType}
      />

      <ProjectLocationBoundaryDialog
        isOpen={showLocationBoundaryDialog}
        onClose={() => setShowLocationBoundaryDialog(false)}
        onInputCoordinates={() => {
          setShowLocationBoundaryDialog(false);
          openBoundaryDialog();
        }}
        onUploadFile={() => {
          setShowLocationBoundaryDialog(false);
          setShowBoundaryFileSelectDialog(true);
        }}
        boundaryPoints={projectBoundaryPoints}
        initialViewState={viewState}
        initialLocation={projectLocation}
        activeCRS={activeProjectCRS}
        onSave={handleLocationBoundarySave}
      />

      <UnifiedCRSEntryDialog
        isOpen={showUnifiedCRSEntryDialog}
        onClose={() => setShowUnifiedCRSEntryDialog(false)}
        onSelectPath={handleCRSPathSelect}
        hasProjectLocation={!!projectLocation}
      />

    </div>
  );
};

export default ProjectDetails;