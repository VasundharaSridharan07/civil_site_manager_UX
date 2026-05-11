// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { X, Locate, Loader2, Search, MapPin, Plus, Minus, Layers, Trash2 } from "lucide-react";
import MapTiles from '../map/MapTiles';
import { project, unproject } from '../../utils/geoUtils';

interface ProjectLocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: { name: string; lat: number; lng: number } | null) => void;
  initialLocation?: { name: string; lat: number; lng: number } | null;
  initialViewState?: { lat: number; lng: number; zoom: number };
  initialMapType?: string;
}

const ProjectLocationDialog: React.FC<ProjectLocationDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLocation = null,
  initialViewState,
  initialMapType = 'y'
}) => {
  // Map state
  const [viewState, setViewState] = useState(initialViewState || { lat: 51.5, lng: -0.12, zoom: 6 });
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [mapType, setMapType] = useState(initialMapType || 'y');
  const [mapTypeDropdownOpen, setMapTypeDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartCenter, setDragStartCenter] = useState({ lat: 0, lng: 0 });

  // Location state
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [locationName, setLocationName] = useState(initialLocation?.name || "");

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialLocation?.name || "");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isMapSelectionMode, setIsMapSelectionMode] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Refs
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapTypeDropdownRef = useRef<HTMLDivElement>(null);
  const zoomAccumulator = useRef(0);

  // Initialize view when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialLocation) {
        setSelectedLocation({ lat: initialLocation.lat, lng: initialLocation.lng });
        setLocationName(initialLocation.name);
        setSearchQuery(initialLocation.name);
        // Keep location-focused behavior: opening this dialog should not feel zoomed out.
        setViewState({
          lat: initialLocation.lat,
          lng: initialLocation.lng,
          zoom: 14
        });
      } else if (initialViewState) {
        // When no saved location exists, keep the existing parent map context.
        setViewState(initialViewState);
      }
      if (initialMapType) {
        // Guard against unsupported layer codes to avoid blank tiles.
        const validMapTypes = new Set(['m', 's', 'y', 'p']);
        setMapType(validMapTypes.has(initialMapType) ? initialMapType : 'y');
      }
    }
  }, [isOpen, initialViewState, initialLocation, initialMapType]);

  // Handle clicks outside map type dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mapTypeDropdownRef.current && !mapTypeDropdownRef.current.contains(event.target as Node)) {
        setMapTypeDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update map dimensions via ResizeObserver (matches v1 boundary dialog)
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const updateDimensions = () => {
      if (mapContainerRef.current) {
        const { width, height } = mapContainerRef.current.getBoundingClientRect();
        setMapDimensions({ width, height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(() => updateDimensions());
    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isOpen]);

  // Enable mouse wheel zoom on map
  useEffect(() => {
    if (!isOpen) return;
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAccumulator.current += e.deltaY;
      const ZOOM_THRESHOLD = 150;

      if (Math.abs(zoomAccumulator.current) >= ZOOM_THRESHOLD) {
        const zoomChange = zoomAccumulator.current > 0 ? -1 : 1;
        zoomAccumulator.current = 0;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setViewState(prev => {
          const newZoom = Math.min(Math.max(prev.zoom + zoomChange, 2), 20);
          if (newZoom === prev.zoom) return prev;

          const currentCenterPoint = project(prev.lat, prev.lng, prev.zoom);
          const width = rect.width;
          const height = rect.height;
          const worldX = currentCenterPoint.x - (width / 2) + mouseX;
          const worldY = currentCenterPoint.y - (height / 2) + mouseY;
          const cursorGeo = unproject(worldX, worldY, prev.zoom);
          const cursorPointAtNewZoom = project(cursorGeo.lat, cursorGeo.lng, newZoom);
          const newCenterWorldX = cursorPointAtNewZoom.x - mouseX + (width / 2);
          const newCenterWorldY = cursorPointAtNewZoom.y - mouseY + (height / 2);
          const newCenterGeo = unproject(newCenterWorldX, newCenterWorldY, newZoom);

          return { lat: newCenterGeo.lat, lng: newCenterGeo.lng, zoom: newZoom };
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  // Reverse geocoding
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${lat},${lng}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return data[0].display_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setSelectedLocation({ lat, lng });
        setLocationName(result.display_name);
        setSearchQuery(result.display_name);
        setViewState({ lat, lng, zoom: 14 });
        setShowResults(false);
      } else {
        setSearchError("Location not found");
      }
    } catch (err) {
      setSearchError("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle user location
  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsSearching(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setViewState({ lat, lng, zoom: 14 });
        setSelectedLocation({ lat, lng });
        
        const placeName = await reverseGeocode(lat, lng);
        
        if (placeName) {
          setSearchQuery(placeName);
          setLocationName(placeName);
        }
        
        setIsSearching(false);
      },
      (error) => {
        setIsSearching(false);
        alert("Unable to retrieve your location");
      }
    );
  };

  // Clear location
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setLocationName("");
    setSearchQuery("");
  };

  // Autocomplete search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setAllSearchResults([]);
      setShowResults(false);
      setShowAllResults(false);
      setSearchError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      setShowAllResults(false);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=20`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setSearchResults(data.slice(0, 5));
          setAllSearchResults(data);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setAllSearchResults([]);
          setShowResults(false);
        }
      } catch (err) {
        setSearchError("Search failed");
        setSearchResults([]);
        setAllSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle "Get more results"
  const handleGetMoreResults = () => {
    setShowAllResults(true);
    setSearchResults(allSearchResults);
  };

  // Handle search result selection
  const handleResultSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    let newZoom = 14;
    
    if (result.boundingbox && Array.isArray(result.boundingbox) && result.boundingbox.length === 4) {
      const bbox = [
        parseFloat(result.boundingbox[0]),
        parseFloat(result.boundingbox[1]),
        parseFloat(result.boundingbox[2]),
        parseFloat(result.boundingbox[3])
      ];
      
      const calculateZoomFromBounds = (
        minLat: number,
        maxLat: number,
        minLng: number,
        maxLng: number
      ) => {
        const mapWidth = mapDimensions.width || 600;
        const mapHeight = mapDimensions.height || 400;
        
        for (let z = 18; z >= 2; z--) {
          const sw = project(minLat, minLng, z);
          const ne = project(maxLat, maxLng, z);
          const boundsWidth = Math.abs(ne.x - sw.x);
          const boundsHeight = Math.abs(sw.y - ne.y);
          if (boundsWidth <= mapWidth * 0.9 && boundsHeight <= mapHeight * 0.9) {
            return z;
          }
        }
        return 2;
      };
      
      newZoom = calculateZoomFromBounds(bbox[0], bbox[1], bbox[2], bbox[3]);
    }
    
    setSelectedLocation({ lat, lng });
    setLocationName(result.display_name);
    setSearchQuery(result.display_name);
    setViewState({ lat, lng, zoom: newZoom });
    setShowResults(false);
    setIsInputFocused(false);
  };

  // Handle "Set location in map"
  const handleSetLocationInMap = () => {
    setIsMapSelectionMode(true);
    setShowResults(false);
    setIsInputFocused(false);
  };

  // Handle map click for location selection
  const handleMapClickForLocation = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMapSelectionMode) return;
    
    const mapElement = e.currentTarget;
    const rect = mapElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    const worldX = centerPoint.x - (rect.width / 2) + x;
    const worldY = centerPoint.y - (rect.height / 2) + y;
    const geo = unproject(worldX, worldY, viewState.zoom);
    
    setSelectedLocation({ lat: geo.lat, lng: geo.lng });
    setViewState(prev => ({ ...prev, lat: geo.lat, lng: geo.lng }));
    setIsMapSelectionMode(false);
    
    setIsSearching(true);
    
    const placeName = await reverseGeocode(geo.lat, geo.lng);
    
    if (placeName) {
      setSearchQuery(placeName);
      setLocationName(placeName);
    }
    
    setIsSearching(false);
  };

  // Map panning handlers
  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    // Always record click origin so the distance check in mouseUp works
    setDragStart({ x: e.clientX, y: e.clientY });

    if (isMapSelectionMode) return;
    
    e.preventDefault();
    setIsDragging(true);
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

  // Zoom handlers
  const handleZoomIn = () => {
    setViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 1, 20) }));
  };

  const handleZoomOut = () => {
    setViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 1, 2) }));
  };

  // Save handler
  const handleSave = () => {
    if (selectedLocation) {
      onSave({
        name: locationName,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      });
    } else {
      onSave(null);
    }
    onClose();
  };

  // Cancel handler
  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  const mapTypeOptions = [
    { value: 'm', label: 'Road Map' },
    { value: 's', label: 'Satellite' },
    { value: 'y', label: 'Hybrid' },
    { value: 'p', label: 'Terrain' }
  ];

  const activeMapType = mapTypeOptions.some(opt => opt.value === mapType) ? mapType : 'y';
  const selectedMapTypeLabel = mapTypeOptions.find(opt => opt.value === activeMapType)?.label || 'Hybrid';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-[2px] shadow-xl w-[95vw] h-[90vh] max-w-[1400px] max-h-[900px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d0d7]">
          <h2 className="text-[20px] font-bold text-[#363545]">Project Location</h2>
          <button
            onClick={handleCancel}
            className="text-[#6a6976] hover:text-[#363545] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Instructions and Search */}
          <div className="basis-[400px] min-w-[400px] max-w-[400px] shrink-0 border-r border-[#d0d0d7] p-6 flex flex-col overflow-y-auto bg-white z-10">
            <div className="mb-6">
              <p className="text-[14px] text-[#6a6976] leading-relaxed">
                Set your project location by searching for a place, using your current location, or clicking directly on the map.
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-4" ref={searchContainerRef}>
              <label className="block text-[12px] text-[#6a6976] mb-2">Search Location</label>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsInputFocused(false), 200);
                  }}
                  placeholder="Search for a location..."
                  className="w-full h-[40px] pl-10 pr-10 border border-[#d0d0d7] rounded-[2px] text-[14px] text-[#363545] outline-none focus:border-[#005f9e] bg-white transition-colors"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6976] hover:text-[#005f9e]"
                  title="Search location"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : selectedLocation ? (
                    <MapPin className="w-4 h-4 text-[#005f9e]" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={selectedLocation ? handleClearLocation : handleGetUserLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a6976] hover:text-[#005f9e]"
                  title={selectedLocation ? "Clear location" : "Use my location"}
                >
                  <Locate className="w-4 h-4" />
                </button>
              </form>

              {/* Search Results Dropdown */}
              {isInputFocused && (showResults || searchResults.length === 0) && (
                <div className="absolute bg-white border border-[#d0d0d7] shadow-lg rounded-[2px] max-h-80 flex flex-col z-50 mt-1 w-[352px]">
                  {searchResults.length > 0 && (
                    <div className="overflow-y-auto flex-1 min-h-0">
                      {searchResults.map((result) => (
                        <button
                          type="button"
                          key={result.place_id}
                          onClick={() => handleResultSelect(result)}
                          className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-[#e5f0f8] border-b border-[#f3f3f7]"
                        >
                          <MapPin className="w-4 h-4 text-[#6a6976] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium text-[13px] text-[#363545]">
                              {result.display_name.split(',')[0]}
                            </div>
                            <div className="truncate text-[11px] text-[#6a6976]">
                              {result.display_name.split(',').slice(1).join(',').trim()}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className={`flex-shrink-0 ${searchResults.length > 0 ? 'border-t border-[#d0d0d7]' : ''}`}>
                    {!showAllResults && allSearchResults.length > searchResults.length && searchResults.length > 0 && (
                      <button
                        type="button"
                        onClick={handleGetMoreResults}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#e5f0f8] border-b border-[#f3f3f7]"
                      >
                        <Search className="w-4 h-4 text-[#6a6976] flex-shrink-0" />
                        <span className="text-[13px] text-[#363545]">Get more results</span>
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleSetLocationInMap}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#e5f0f8]"
                    >
                      <div className="relative flex-shrink-0">
                        <MapPin className="w-4 h-4 text-[#6a6976]" />
                        <Plus className="w-2.5 h-2.5 text-[#6a6976] absolute -bottom-0.5 -right-0.5 bg-white rounded-full" strokeWidth={3} />
                      </div>
                      <span className="text-[13px] text-[#363545]">Set location in map</span>
                    </button>
                  </div>
                </div>
              )}

              {searchError && (
                <div className="mt-2 text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  {searchError}
                </div>
              )}
            </div>

            {/* Selected Location Display */}
            {selectedLocation && (
              <div className="mt-4 p-4 bg-[#f3f3f7] rounded-[2px] border border-[#d0d0d7]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#005f9e]" />
                    <span className="text-[12px] font-semibold text-[#363545]">Selected Location</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                    title="Erase selected location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[13px] text-[#363545] mb-2">{locationName}</p>
                <p className="text-[11px] text-[#6a6976]">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            )}

            {/* Footer with Cancel and Save Buttons */}
            <div className="mt-auto pt-6 border-t border-[#d0d0d7] bg-[#f9f9fb] -mx-6 -mb-6 px-6 py-4 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="text-[#005f9e] text-[14px] font-bold hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-[#005f9e] hover:bg-[#00437b] text-white text-[14px] font-bold py-2.5 px-6 rounded-[2px]"
              >
                Save
              </button>
            </div>
          </div>

          {/* Right Side - Map */}
          <div className="flex-1 relative">
            <div
              ref={mapContainerRef}
              className={`w-full h-full ${isMapSelectionMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onMouseLeave={handleMapMouseLeave}
            >
              {/* Map Selection Mode Overlay Message */}
              {isMapSelectionMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#005f9e] text-white px-4 py-2 rounded-[2px] shadow-lg z-30 text-[13px] font-semibold">
                  Click on the map to set your project location
                </div>
              )}

              <MapTiles
                viewState={viewState}
                mapDimensions={mapDimensions}
                mapType={activeMapType}
              />

              {/* Location Marker */}
              {selectedLocation && (() => {
                const point = project(selectedLocation.lat, selectedLocation.lng, viewState.zoom);
                const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
                const x = (mapDimensions.width / 2) + (point.x - centerPoint.x);
                const y = (mapDimensions.height / 2) + (point.y - centerPoint.y);

                return (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <MapPin
                      className="w-10 h-10 text-[#005f9e] drop-shadow-lg"
                      fill="white"
                      stroke="#005f9e"
                      strokeWidth={2}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Map Type Selector - Bottom Left */}
            <div className="absolute bottom-6 left-6 z-20" ref={mapTypeDropdownRef}>
              <button
                onClick={() => setMapTypeDropdownOpen(!mapTypeDropdownOpen)}
                className="bg-white border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[13px] text-[#363545] hover:bg-[#f3f3f7] shadow-sm flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                {selectedMapTypeLabel}
              </button>

              {mapTypeDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-1 bg-white border border-[#d0d0d7] shadow-lg rounded-[2px] z-50 min-w-[120px]">
                  {mapTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setMapType(option.value);
                        setMapTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#e5f0f8] ${
                        mapType === option.value ? 'bg-[#e5f0f8] font-medium' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Zoom Controls - Bottom Right */}
            <div className="absolute bottom-6 right-6 z-20 bg-white border border-[#d0d0d7] rounded-[2px] shadow-sm overflow-hidden">
              <button
                onClick={handleZoomIn}
                className="w-10 h-10 flex items-center justify-center hover:bg-[#f3f3f7] border-b border-[#d0d0d7]"
                title="Zoom in"
              >
                <Plus className="w-4 h-4 text-[#363545]" />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-10 h-10 flex items-center justify-center hover:bg-[#f3f3f7]"
                title="Zoom out"
              >
                <Minus className="w-4 h-4 text-[#363545]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectLocationDialog;
