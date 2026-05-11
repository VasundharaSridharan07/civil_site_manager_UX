// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { X, Locate, PenTool, Keyboard, Upload, Loader2, Search, Layers, MapPin, ArrowLeft, Trash2, Check, Undo2, Redo2, RefreshCw, AlertCircle, Copy } from "lucide-react";
import MapTiles from '../map/MapTiles';
import { Plus, Minus } from "lucide-react";
import { project, unproject, distSq } from '../../utils/geoUtils';
import type { CRSItem } from '../../types';
import { geoToProjected, projectedToGeo, getCRSAxisOrder, parseProjectedValue, getUnitAbbreviation } from '../../utils/coordinateTransform';

interface ProjectLocationBoundaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDrawBoundary?: () => void;
  onInputCoordinates: () => void;
  onUploadFile: () => void;
  boundaryPoints?: { lat: number, lng: number }[];
  initialViewState?: { lat: number, lng: number, zoom: number };
  initialLocation?: { name: string; lat: number; lng: number } | null;
  activeCRS?: CRSItem | null;
  onSave?: (data: { 
    location: { name: string; lat: number; lng: number } | null;
    boundaryPoints: { lat: number; lng: number }[];
    mapType: string;
  }) => void;
}

const ProjectLocationBoundaryDialog: React.FC<ProjectLocationBoundaryDialogProps> = ({
  isOpen,
  onClose,
  onDrawBoundary,
  onInputCoordinates,
  onUploadFile,
  boundaryPoints = [],
  initialViewState,
  initialLocation,
  activeCRS = null,
  onSave
}) => {
  // Map state - initialize with initialViewState if provided, otherwise use default
  const [viewState, setViewState] = useState(initialViewState || { lat: 51.5, lng: -0.12, zoom: 6 });
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [mapType, setMapType] = useState('y');
  const [mapTypeDropdownOpen, setMapTypeDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartCenter, setDragStartCenter] = useState({ lat: 0, lng: 0 });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isMapSelectionMode, setIsMapSelectionMode] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedLocationMarker, setSelectedLocationMarker] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");

  // Boundary drawing state
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [drawnBoundaryPoints, setDrawnBoundaryPoints] = useState<{ lat: number, lng: number }[]>([]);
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [isNearFirstPointHover, setIsNearFirstPointHover] = useState(false);

  // Coordinate input state
  const [isInputCoordinatesMode, setIsInputCoordinatesMode] = useState(false);
  const [coordinateInputValue, setCoordinateInputValue] = useState("");
  
  // Derive hasProjectedCRS from activeCRS prop
  const hasProjectedCRS = !!activeCRS && activeCRS.type === 'Projected';
  
  // Default coordinateFormat based on whether CRS is selected
  const getDefaultCoordinateFormat = (): 'geo' | 'proj' => {
    return hasProjectedCRS ? 'proj' : 'geo';
  };
  
  const [coordinateFormat, setCoordinateFormat] = useState<'geo' | 'proj'>(getDefaultCoordinateFormat());
  const [parsedCoordinates, setParsedCoordinates] = useState<{ lat: number, lng: number }[]>([]);
  const [coordinateOrderSwapped, setCoordinateOrderSwapped] = useState(false);
  const [showSwapSuggestion, setShowSwapSuggestion] = useState(false);
  const [showCoordinateCard, setShowCoordinateCard] = useState(false); // Control when to show the card
  const isProgrammaticUpdate = useRef(false); // Flag to prevent infinite loops
  
  // State to hold projected coordinates for display
  const [displayProjectedCoords, setDisplayProjectedCoords] = useState<{easting: number, northing: number}[]>([]);
  const [displayDrawnProjectedCoords, setDisplayDrawnProjectedCoords] = useState<{easting: number, northing: number}[]>([]);

  // Upload file state
  const [isUploadFileMode, setIsUploadFileMode] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Point dragging state
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  
  // Edit mode state - when true, shows circles and allows editing
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Line hover state for adding new points
  const [hoveredLinePosition, setHoveredLinePosition] = useState<{ x: number, y: number, insertIndex: number } | null>(null);
  
  // Track Option/Alt key state for delete cursor
  const [isAltKeyPressed, setIsAltKeyPressed] = useState(false);
  
  // Context menu state for right-click on anchor points
  const [anchorContextMenu, setAnchorContextMenu] = useState<{ x: number, y: number, pointIndex: number } | null>(null);
  
  // Undo/Redo history for boundary editing
  const [boundaryHistory, setBoundaryHistory] = useState<{ lat: number, lng: number }[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Selected point for toolbar delete operation
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  
  // Selected coordinate index for map-table bidirectional highlighting
  const [selectedCoordinateIndex, setSelectedCoordinateIndex] = useState<number | null>(null);
  
  // Delete mode - when true, clicking on a point deletes it
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  
  // Toolbar add mode - when true, clicking on line adds a point
  const [isAddMode, setIsAddMode] = useState(false);

  // Copy coordinates feedback state
  const [copyFeedback, setCopyFeedback] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mapTypeRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Initialize with existing boundary points if any
      setDrawnBoundaryPoints(boundaryPoints);
      setIsDrawingBoundary(false);
      setCursorPosition(null);
      setIsInputCoordinatesMode(false);
      setIsUploadFileMode(false);
      setCoordinateInputValue("");
      setIsEditMode(false);
      setSelectedCoordinateIndex(null);
      setAnchorContextMenu(null);
      setParsedCoordinates([]);
      setCoordinateOrderSwapped(false);
      setShowSwapSuggestion(false);
      setShowCoordinateCard(false);
      
      // Set default coordinate format based on CRS
      setCoordinateFormat(getDefaultCoordinateFormat());
      
      // Initialize with existing location if provided
      if (initialLocation) {
        setSearchQuery(initialLocation.name);
        setSelectedLocationName(initialLocation.name);
        setSelectedLocationMarker({ lat: initialLocation.lat, lng: initialLocation.lng });
      } else {
        setSearchQuery("");
        setSelectedLocationName("");
        setSelectedLocationMarker(null);
      }
    }
  }, [isOpen, boundaryPoints, initialLocation, hasProjectedCRS]);

  // Handle ESC key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawingBoundary) {
        handleCancelDrawing();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isDrawingBoundary]);

  // Track Alt/Option key state for delete cursor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        setIsAltKeyPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) {
        setIsAltKeyPressed(false);
      }
    };
    
    if (isOpen && isEditMode) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [isOpen, isEditMode]);

  // Initialize history when entering edit mode with existing points
  useEffect(() => {
    if (isEditMode && drawnBoundaryPoints.length >= 3 && boundaryHistory.length === 0) {
      // Initialize history with current points
      setBoundaryHistory([drawnBoundaryPoints]);
      setHistoryIndex(0);
    }
  }, [isEditMode, drawnBoundaryPoints.length]);

  // Sync boundary points back to coordinate input when in input mode and points are dragged
  useEffect(() => {
    if (isInputCoordinatesMode && drawnBoundaryPoints.length > 0 && !isDrawingBoundary) {
      // Only update if we're not currently typing (to avoid overwriting user input)
      // We detect dragging by checking if isDraggingPoint is active or just finished
      formatCoordinatesToText(drawnBoundaryPoints).then(formattedText => {
        // Only update if the text has actually changed (to avoid cursor jumping)
        if (formattedText !== coordinateInputValue.trim()) {
          setCoordinateInputValue(formattedText);
        }
      });
    }
  }, [drawnBoundaryPoints, isInputCoordinatesMode, coordinateFormat, activeCRS]);

  // Start drawing mode
  const handleStartDrawing = () => {
    setIsDrawingBoundary(true);
    setDrawnBoundaryPoints([]);
  };

  // Cancel drawing and clear points
  const handleCancelDrawing = () => {
    setIsDrawingBoundary(false);
    setDrawnBoundaryPoints([]);
    setCursorPosition(null);
    setSelectedCoordinateIndex(null);
  };

  // Handle opening coordinate input mode
  const handleOpenCoordinateInput = () => {
    setIsInputCoordinatesMode(true);
  };

  // Handle back from coordinate input
  const handleBackFromCoordinateInput = () => {
    setIsInputCoordinatesMode(false);
    // Keep coordinateInputValue so data is preserved
  };

  // Handle opening upload file mode
  const handleOpenUploadFile = () => {
    setIsUploadFileMode(true);
  };

  // Handle back from upload file mode
  const handleBackFromUploadFile = () => {
    setIsUploadFileMode(false);
  };

  // Parse CSV file and extract coordinates
  const parseCSVFile = async (file: File): Promise<{ lat: number, lng: number }[] | null> => {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row');
        return null;
      }
      
      // Parse header to find lat/lng column indices
      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const latIndex = header.findIndex(h => h.includes('lat'));
      const lngIndex = header.findIndex(h => h.includes('lon') || h.includes('lng'));
      
      if (latIndex === -1 || lngIndex === -1) {
        alert('CSV file must contain latitude and longitude columns');
        return null;
      }
      
      // Parse data rows
      const points: { lat: number, lng: number }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const lat = parseFloat(values[latIndex]);
        const lng = parseFloat(values[lngIndex]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push({ lat, lng });
        }
      }
      
      if (points.length < 3) {
        alert('CSV file must contain at least 3 valid coordinate pairs');
        return null;
      }
      
      return points;
    } catch (err) {
      console.error('Error parsing CSV file:', err);
      alert('Failed to parse CSV file');
      return null;
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const points = await parseCSVFile(file);
      
      if (points) {
        // Set the boundary points
        setDrawnBoundaryPoints(points);
        
        // Calculate bounding box and fit view
        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        // Calculate zoom to fit boundary
        const calculateZoomFromBounds = (
          minLat: number,
          maxLat: number,
          minLng: number,
          maxLng: number,
          width: number,
          height: number
        ) => {
          for (let z = 18; z >= 2; z--) {
            const sw = project(minLat, minLng, z);
            const ne = project(maxLat, maxLng, z);
            const boundsWidth = Math.abs(ne.x - sw.x);
            const boundsHeight = Math.abs(sw.y - ne.y);
            if (boundsWidth <= width * 0.9 && boundsHeight <= height * 0.9) {
              return z;
            }
          }
          return 2;
        };
        
        const newZoom = calculateZoomFromBounds(minLat, maxLat, minLng, maxLng, mapDimensions.width, mapDimensions.height);
        setViewState({ lat: centerLat, lng: centerLng, zoom: newZoom });
        
        // Automatically enable edit mode after uploading
        setIsEditMode(true);
        
        // Auto-detect location from boundary center if not set
        if (!selectedLocationMarker) {
          setSelectedLocationMarker({ lat: centerLat, lng: centerLng });
          setIsSearching(true);
          
          reverseGeocode(centerLat, centerLng).then(placeName => {
            if (placeName) {
              setSearchQuery(placeName);
              setSelectedLocationName(placeName);
            } else {
              const coordStr = `${formatLatForDisplay(centerLat)}, ${formatLongForDisplay(centerLng)}`;
              setSearchQuery(coordStr);
              setSelectedLocationName(coordStr);
            }
            setIsSearching(false);
          });
        }
        
        // Exit upload mode and return to main view
        setIsUploadFileMode(false);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle click on upload area
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Detect if coordinates are in wrong order (lng, lat instead of lat, lng)
  const detectCoordinateOrder = (text: string): 'correct' | 'swapped' | 'ambiguous' => {
    if (!text.trim()) return 'ambiguous';
    
    try {
      const cleanText = text.replace(/^example\s*/i, '').trim();
      const values = cleanText
        .split(/[\n,\s]+/)
        .map(v => v.trim())
        .filter(v => v && !isNaN(parseFloat(v)))
        .map(v => parseFloat(v));
      
      if (values.length < 6 || values.length % 2 !== 0) {
        return 'ambiguous';
      }
      
      let invalidAsLatLng = 0;
      let invalidAsLngLat = 0;
      
      for (let i = 0; i < values.length; i += 2) {
        const first = values[i];
        const second = values[i + 1];
        
        // Check if valid as (Lat, Lng)
        if (first < -90 || first > 90) invalidAsLatLng++;
        if (second < -180 || second > 180) invalidAsLatLng++;
        
        // Check if valid as (Lng, Lat)
        if (first < -180 || first > 180) invalidAsLngLat++;
        if (second < -90 || second > 90) invalidAsLngLat++;
      }
      
      // If one interpretation has violations and the other doesn't, suggest the correct one
      if (invalidAsLatLng > 0 && invalidAsLngLat === 0) return 'swapped';
      if (invalidAsLatLng === 0 && invalidAsLngLat > 0) return 'correct';
      
      return 'ambiguous'; // Both interpretations are valid
    } catch (err) {
      return 'ambiguous';
    }
  };

  // Parse coordinate input text into boundary points
  const parseCoordinates = async (text: string, forceSwap: boolean = false): Promise<{ lat: number, lng: number }[] | null> => {
    if (!text.trim()) return null;
    
    try {
      // Remove "example" text if present
      const cleanText = text.replace(/^example\s*/i, '').trim();
      
      // Split by newlines, commas, or spaces and filter out empty strings
      const values = cleanText
        .split(/[\n,\s]+/)
        .map(v => v.trim())
        .filter(v => v && !isNaN(parseFloat(v)))
        .map(v => parseFloat(v));
      
      // Must have even number of values (pairs)
      if (values.length < 6 || values.length % 2 !== 0) {
        return null;
      }
      
      // Convert pairs to lat/lng points
      const points: { lat: number, lng: number }[] = [];
      
      if (coordinateFormat === 'geo') {
        // Geographic mode: parse as lat, lng (with optional swap)
        const shouldSwap = forceSwap || coordinateOrderSwapped;
        
        for (let i = 0; i < values.length; i += 2) {
          if (shouldSwap) {
            points.push({ lat: values[i + 1], lng: values[i] });
          } else {
            points.push({ lat: values[i], lng: values[i + 1] });
          }
        }
      } else if (coordinateFormat === 'proj' && activeCRS) {
        // Projected mode: parse as E,N and transform to lat,lng
        const axisOrder = getCRSAxisOrder(activeCRS.code);
        
        for (let i = 0; i < values.length; i += 2) {
          let easting: number, northing: number;
          
          // Parse based on CRS axis order
          if (axisOrder === 'EN') {
            easting = values[i];
            northing = values[i + 1];
          } else {
            // NE order
            northing = values[i];
            easting = values[i + 1];
          }
          
          // Transform projected coordinates to geographic
          const geoCoords = await projectedToGeo(easting, northing, activeCRS.code);
          
          if (geoCoords) {
            points.push({ lat: geoCoords.lat, lng: geoCoords.lng });
          } else {
            console.error(`Failed to transform projected coordinates: ${easting}, ${northing}`);
            return null;
          }
        }
      } else {
        // Projected mode but no CRS - shouldn't happen, but fallback
        return null;
      }
      
      return points;
    } catch (err) {
      console.error('Error parsing coordinates:', err);
      return null;
    }
  };

  // Format boundary points back to coordinate text
  const formatCoordinatesToText = async (points: { lat: number, lng: number }[]): Promise<string> => {
    if (points.length === 0) return '';
    
    if (coordinateFormat === 'geo') {
      // Geographic: lat, lng
      return points.map(point => `${point.lat.toFixed(7)}, ${point.lng.toFixed(7)}`).join('\n');
    } else if (coordinateFormat === 'proj' && activeCRS) {
      // Projected: transform lat,lng to E,N
      const projectedLines: string[] = [];
      const axisOrder = getCRSAxisOrder(activeCRS.code);
      
      for (const point of points) {
        const projCoords = await geoToProjected(point.lat, point.lng, activeCRS.code);
        
        if (projCoords) {
          // Format based on axis order
          if (axisOrder === 'EN') {
            projectedLines.push(`${projCoords.easting.toFixed(3)}, ${projCoords.northing.toFixed(3)}`);
          } else {
            // NE order
            projectedLines.push(`${projCoords.northing.toFixed(3)}, ${projCoords.easting.toFixed(3)}`);
          }
        }
      }
      
      return projectedLines.join('\n');
    }
    
    return '';
  };
  
  // Update displayed projected coordinates when format changes or coordinates change
  useEffect(() => {
    if (coordinateFormat === 'proj' && activeCRS && parsedCoordinates.length > 0) {
      // Transform all coordinates to projected
      Promise.all(
        parsedCoordinates.map(coord => geoToProjected(coord.lat, coord.lng, activeCRS.code))
      ).then(results => {
        const projCoords = results.filter(r => r !== null) as {easting: number, northing: number}[];
        setDisplayProjectedCoords(projCoords);
      });
    }
  }, [coordinateFormat, parsedCoordinates, activeCRS]);
  
  // Update displayed projected coordinates for drawn boundary points
  useEffect(() => {
    if (coordinateFormat === 'proj' && activeCRS && drawnBoundaryPoints.length > 0) {
      Promise.all(
        drawnBoundaryPoints.map(coord => geoToProjected(coord.lat, coord.lng, activeCRS.code))
      ).then(results => {
        const projCoords = results.filter(r => r !== null) as {easting: number, northing: number}[];
        setDisplayDrawnProjectedCoords(projCoords);
      });
    }
  }, [coordinateFormat, drawnBoundaryPoints, activeCRS]);

  // Auto-preview coordinates as user types (with debounce)
  useEffect(() => {
    if (!isInputCoordinatesMode || !coordinateInputValue.trim()) {
      setParsedCoordinates([]);
      setShowSwapSuggestion(false);
      return;
    }

    // Skip if this is a programmatic update (to avoid infinite loops)
    if (isProgrammaticUpdate.current) {
      isProgrammaticUpdate.current = false;
      return;
    }

    const timeoutId = setTimeout(async () => {
      // Only show swap detection in geographic mode
      if (coordinateFormat === 'geo') {
        const orderDetection = detectCoordinateOrder(coordinateInputValue);
        
        // Show swap suggestion if coordinates appear to be swapped
        if (orderDetection === 'swapped' && !coordinateOrderSwapped) {
          setShowSwapSuggestion(true);
        } else {
          setShowSwapSuggestion(false);
        }
      } else {
        // No swap detection in projected mode
        setShowSwapSuggestion(false);
      }
      
      const points = await parseCoordinates(coordinateInputValue);
      
      if (!points || points.length < 3) {
        // Clear boundary if invalid
        setParsedCoordinates([]);
        if (drawnBoundaryPoints.length > 0 && isInputCoordinatesMode) {
          setDrawnBoundaryPoints([]);
        }
        return;
      }
      
      // Update parsed coordinates for table display
      setParsedCoordinates(points);
    }, 500); // 500ms debounce to avoid too many updates while typing

    return () => clearTimeout(timeoutId);
  }, [coordinateInputValue, coordinateFormat, isInputCoordinatesMode, mapDimensions.width, mapDimensions.height, coordinateOrderSwapped, activeCRS]);

  // Handle save from coordinate input mode
  const handleSaveCoordinates = async () => {
    const points = await parseCoordinates(coordinateInputValue);
    
    if (!points || points.length < 3) {
      alert('Please enter at least 3 valid coordinate pairs');
      return;
    }
    
    // Set the boundary points
    setDrawnBoundaryPoints(points);

    // Fit map view once user confirms coordinates
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const newZoom = calculateZoomFromBounds(minLat, maxLat, minLng, maxLng, mapDimensions.width, mapDimensions.height);
    setViewState({ lat: centerLat, lng: centerLng, zoom: newZoom });
    
    // Automatically enable edit mode after saving coordinates
    setIsEditMode(true);
    
    // Exit coordinate input mode and show the boundary in main view
    setIsInputCoordinatesMode(false);
  };

  // Handle swapping coordinate columns
  const handleSwapColumns = () => {
    // Swap the actual lat/lng values in the parsed coordinates
    const swappedCoords = parsedCoordinates.map(coord => ({
      lat: coord.lng,
      lng: coord.lat
    }));
    
    setParsedCoordinates(swappedCoords);
    
    // Update textarea with swapped values
    const newText = swappedCoords.map(point => 
      `${point.lat.toFixed(7)}, ${point.lng.toFixed(7)}`
    ).join('\n');
    
    // Set flag to prevent useEffect from triggering
    isProgrammaticUpdate.current = true;
    setCoordinateInputValue(newText);
    
    // Toggle the swapped state for display purposes
    setCoordinateOrderSwapped(!coordinateOrderSwapped);
    setShowSwapSuggestion(false);

    // In stage 2, reflect swap on map and refit to new coordinates
    if (showCoordinateCard && swappedCoords.length >= 2) {
      setDrawnBoundaryPoints(swappedCoords);
      const lats = swappedCoords.map(p => p.lat);
      const lngs = swappedCoords.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const newZoom = calculateZoomFromBounds(minLat, maxLat, minLng, maxLng, mapDimensions.width, mapDimensions.height);
      setViewState({ lat: centerLat, lng: centerLng, zoom: newZoom });
    }
  };

  // Handle updating a single coordinate in the table
  const handleUpdateCoordinate = (index: number, field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const updatedCoords = [...parsedCoordinates];
    updatedCoords[index] = {
      ...updatedCoords[index],
      [field]: numValue
    };
    
    setParsedCoordinates(updatedCoords);
    
    // Update textarea to reflect changes
    const newText = updatedCoords.map(point => 
      `${point.lat.toFixed(7)}, ${point.lng.toFixed(7)}`
    ).join('\n');
    
    // Set flag to prevent useEffect from triggering
    isProgrammaticUpdate.current = true;
    setCoordinateInputValue(newText);
  };

  // Handle deleting a coordinate pair
  const handleDeleteCoordinatePair = (index: number) => {
    if (parsedCoordinates.length <= 3) {
      alert('A boundary requires at least 3 coordinate pairs');
      return;
    }
    
    const updatedCoords = parsedCoordinates.filter((_, i) => i !== index);
    setParsedCoordinates(updatedCoords);
    setSelectedCoordinateIndex(null);
    
    // Update textarea to reflect changes
    const newText = updatedCoords.map(point => 
      `${point.lat.toFixed(7)}, ${point.lng.toFixed(7)}`
    ).join('\n');
    
    // Set flag to prevent useEffect from triggering
    isProgrammaticUpdate.current = true;
    setCoordinateInputValue(newText);
  };

  // Handle adding a new coordinate pair
  const handleAddCoordinatePair = () => {
    const newCoord = { lat: 0, lng: 0 };
    const updatedCoords = [...parsedCoordinates, newCoord];
    setParsedCoordinates(updatedCoords);
    
    // Update textarea to reflect changes
    const newText = updatedCoords.map(point => 
      `${point.lat.toFixed(7)}, ${point.lng.toFixed(7)}`
    ).join('\n');
    
    // Set flag to prevent useEffect from triggering
    isProgrammaticUpdate.current = true;
    setCoordinateInputValue(newText);
  };

  // Check if click is near first point to close polygon
  const isNearFirstPoint = (screenX: number, screenY: number): boolean => {
    if (drawnBoundaryPoints.length < 3) return false;
    
    const firstPoint = drawnBoundaryPoints[0];
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    const firstPointScreen = project(firstPoint.lat, firstPoint.lng, viewState.zoom);
    
    const firstX = firstPointScreen.x - (centerPoint.x - mapDimensions.width / 2);
    const firstY = firstPointScreen.y - (centerPoint.y - mapDimensions.height / 2);
    
    const distance = Math.sqrt(distSq(screenX, screenY, firstX, firstY));
    return distance < 15; // 15px threshold
  };

  // Handle map click for boundary drawing
  const handleMapClickForBoundary = async (e: React.MouseEvent) => {
    if (!isDrawingBoundary) return;
    
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking near first point to close polygon
    if (isNearFirstPoint(x, y)) {
      // Complete the polygon and exit drawing mode
      setIsDrawingBoundary(false);
      setCursorPosition(null);
      setIsNearFirstPointHover(false);
      
      // Automatically enable edit mode after completing the drawing
      setIsEditMode(true);
      
      // If no location is set, auto-detect from boundary center
      if (!selectedLocationMarker && drawnBoundaryPoints.length >= 3) {
        const lats = drawnBoundaryPoints.map(p => p.lat);
        const lngs = drawnBoundaryPoints.map(p => p.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        
        // Set marker at center
        setSelectedLocationMarker({ lat: centerLat, lng: centerLng });
        setIsSearching(true);
        
        // Reverse geocode to get place name
        const placeName = await reverseGeocode(centerLat, centerLng);
        
        if (placeName) {
          setSearchQuery(placeName);
          setSelectedLocationName(placeName);
        } else {
          const coordStr = `${formatLatForDisplay(centerLat)}, ${formatLongForDisplay(centerLng)}`;
          setSearchQuery(coordStr);
          setSelectedLocationName(coordStr);
        }
        
        setIsSearching(false);
      }
      return;
    }
    
    // Convert pixel coordinates to geographic coordinates
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    const worldX = centerPoint.x - (rect.width / 2) + x;
    const worldY = centerPoint.y - (rect.height / 2) + y;
    const geo = unproject(worldX, worldY, viewState.zoom);
    
    // Add point and update history
    setDrawnBoundaryPoints(prev => {
      const newPoints = [...prev, geo];
      
      // Highlight the newly added point
      setSelectedCoordinateIndex(newPoints.length - 1);
      
      // Update history after adding point
      if (prev.length === 0) {
        // First point - initialize history
        setBoundaryHistory([newPoints]);
        setHistoryIndex(0);
      } else {
        // Subsequent points - save new state to history
        setHistoryIndex(currentIndex => {
          setBoundaryHistory(currentHistory => {
            const newHistory = currentHistory.slice(0, currentIndex + 1);
            newHistory.push(newPoints);
            // Limit history to 50 states
            if (newHistory.length > 50) {
              newHistory.shift();
              return newHistory;
            }
            return newHistory;
          });
          return currentIndex + 1;
        });
      }
      
      return newPoints;
    });
  };

  // Handle save
  const handleSaveChanges = () => {
    if (onSave) {
      onSave({
        location: selectedLocationMarker 
          ? { name: selectedLocationName, lat: selectedLocationMarker.lat, lng: selectedLocationMarker.lng }
          : null,
        boundaryPoints: drawnBoundaryPoints,
        mapType: mapType
      });
    }
    onClose();
  };

  // Resize Observer for map
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

  // Fit view to boundary when dialog opens, or use initialViewState if no boundary
  useEffect(() => {
    if (!isOpen) return;
    
    // If we have boundary points and map dimensions, fit to boundary
    if (boundaryPoints.length >= 2 && mapDimensions.width > 0 && mapDimensions.height > 0) {
      // Calculate bounding box from boundary points
      const lats = boundaryPoints.map(p => p.lat);
      const lngs = boundaryPoints.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      // Calculate center
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      // Calculate zoom to fit boundary
      const calculateZoomFromBounds = (
        minLat: number,
        maxLat: number,
        minLng: number,
        maxLng: number,
        width: number,
        height: number
      ) => {
        for (let z = 18; z >= 2; z--) {
          const sw = project(minLat, minLng, z);
          const ne = project(maxLat, maxLng, z);
          const boundsWidth = Math.abs(ne.x - sw.x);
          const boundsHeight = Math.abs(sw.y - ne.y);
          if (boundsWidth <= width * 0.9 && boundsHeight <= height * 0.9) {
            return z;
          }
        }
        return 2;
      };
      
      const newZoom = calculateZoomFromBounds(minLat, maxLat, minLng, maxLng, mapDimensions.width, mapDimensions.height);
      
      // Update view state to show boundary
      setViewState({ lat: centerLat, lng: centerLng, zoom: newZoom });
    } else if (initialViewState && boundaryPoints.length < 2) {
      // If no boundary, use initialViewState
      setViewState(initialViewState);
    }
  }, [isOpen, boundaryPoints, mapDimensions.width, mapDimensions.height, initialViewState]);

  // Click outside for search results and map type dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (mapTypeRef.current && !mapTypeRef.current.contains(event.target as Node)) {
        setMapTypeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete search as user types
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
          // Show first 4-5 results initially
          setSearchResults(data.slice(0, 4));
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
    }, 300); // Debounce: wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle "Get more results"
  const handleGetMoreResults = () => {
    setShowAllResults(true);
    setSearchResults(allSearchResults);
  };

  // Reverse geocoding: convert coordinates to place name
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      
      if (data && data.address) {
        // Priority: city > town > village > region > state
        const address = data.address;
        const primaryLocation = address.city || 
                               address.town || 
                               address.village || 
                               address.county || 
                               address.state || 
                               address.region;
        
        const country = address.country;
        
        // Build the location string: "City, Country" or just "Country" if no city
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

  // Handle "Set location in map"
  const handleSetLocationInMap = () => {
    setIsMapSelectionMode(true);
    setShowResults(false);
    setIsInputFocused(false);
  };

  // Handle map click when in selection mode
  const handleMapClickForSelection = async (e: React.MouseEvent) => {
    if (!isMapSelectionMode) return;
    
    // Prevent default panning when in selection mode
    e.preventDefault();
    e.stopPropagation();
    
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert pixel coordinates to geographic coordinates
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    const worldX = centerPoint.x - (rect.width / 2) + x;
    const worldY = centerPoint.y - (rect.height / 2) + y;
    const geo = unproject(worldX, worldY, viewState.zoom);
    
    // Set the selected location marker immediately
    setSelectedLocationMarker({ lat: geo.lat, lng: geo.lng });
    setViewState(prev => ({ ...prev, lat: geo.lat, lng: geo.lng }));
    setIsMapSelectionMode(false);
    
    // Show loading state in search bar
    setIsSearching(true);
    
    // Try to get place name via reverse geocoding
    const placeName = await reverseGeocode(geo.lat, geo.lng);
    
    if (placeName) {
      // Use the place name if found
      setSearchQuery(placeName);
      setSelectedLocationName(placeName);
    } else {
      // Fallback to coordinates if reverse geocoding fails
      const coordStr = `${formatLatForDisplay(geo.lat)}, ${formatLongForDisplay(geo.lng)}`;
      setSearchQuery(coordStr);
      setSelectedLocationName(coordStr);
    }
    
    setIsSearching(false);
  };

  // Wheel zoom
  const zoomAccumulator = useRef(0);
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

  // Check if mouse is near a boundary point (when in edit mode OR during drawing for delete mode)
  const getPointAtPosition = (screenX: number, screenY: number): number | null => {
    if (drawnBoundaryPoints.length === 0) return null;
    // Allow getting points during drawing if in delete mode, or in edit mode
    if (!isDeleteMode && !isEditMode) return null;
    
    // During drawing, if hovering near first point to close, don't detect it as a point to delete
    if (isDrawingBoundary && drawnBoundaryPoints.length >= 3 && isNearFirstPoint(screenX, screenY)) {
      return null;
    }
    
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    
    for (let i = 0; i < drawnBoundaryPoints.length; i++) {
      const point = drawnBoundaryPoints[i];
      const pointScreen = project(point.lat, point.lng, viewState.zoom);
      const x = pointScreen.x - (centerPoint.x - mapDimensions.width / 2);
      const y = pointScreen.y - (centerPoint.y - mapDimensions.height / 2);
      
      const distance = Math.sqrt(distSq(screenX, screenY, x, y));
      if (distance < 10) { // 10px threshold for grabbing
        return i;
      }
    }
    return null;
  };

  // Check if mouse is near a line segment (for adding new points)
  const getLineSegmentAtPosition = (screenX: number, screenY: number): { position: { x: number, y: number }, insertIndex: number } | null => {
    if (drawnBoundaryPoints.length < 3 || isDrawingBoundary || !isEditMode) return null;
    
    // First check if we're hovering over an existing point - if so, don't show line hover
    if (getPointAtPosition(screenX, screenY) !== null) return null;
    
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    const threshold = 8; // 8px threshold for line proximity
    
    // Convert all points to screen coordinates
    const screenPoints = drawnBoundaryPoints.map(p => {
      const point = project(p.lat, p.lng, viewState.zoom);
      return {
        x: point.x - (centerPoint.x - mapDimensions.width / 2),
        y: point.y - (centerPoint.y - mapDimensions.height / 2)
      };
    });
    
    // Check each line segment
    for (let i = 0; i < screenPoints.length; i++) {
      const p1 = screenPoints[i];
      const p2 = screenPoints[(i + 1) % screenPoints.length]; // Wrap to first point
      
      // Calculate distance from point to line segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lengthSquared = dx * dx + dy * dy;
      
      if (lengthSquared === 0) continue; // Points are the same
      
      // Calculate projection of cursor onto line segment (clamped to segment)
      let t = ((screenX - p1.x) * dx + (screenY - p1.y) * dy) / lengthSquared;
      t = Math.max(0, Math.min(1, t));
      
      // Find closest point on segment
      const closestX = p1.x + t * dx;
      const closestY = p1.y + t * dy;
      
      // Calculate distance from cursor to closest point
      const distance = Math.sqrt(distSq(screenX, screenY, closestX, closestY));
      
      if (distance < threshold) {
        return {
          position: { x: closestX, y: closestY },
          insertIndex: i + 1 // Insert after point i
        };
      }
    }
    
    return null;
  };

  const deleteBoundaryPoint = (pointIndex: number) => {
    if (drawnBoundaryPoints.length <= 3) return; // Need at least 3 points for a polygon

    saveToHistory(drawnBoundaryPoints);
    setDrawnBoundaryPoints(prev => {
      const newPoints = [...prev];
      newPoints.splice(pointIndex, 1);
      return newPoints;
    });
    setHoveredPointIndex(null);
    setAnchorContextMenu(null);
    setSelectedCoordinateIndex(null);
    setSelectedPointIndex(null);
    // Don't turn off delete mode - keep it active for multiple deletions
    // setIsDeleteMode(false);
  };
  
  // Save current state to history for undo/redo
  const saveToHistory = (points: { lat: number, lng: number }[]) => {
    // Remove any history after current index (when making new changes after undo)
    const newHistory = boundaryHistory.slice(0, historyIndex + 1);
    newHistory.push([...points]);
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    setBoundaryHistory(newHistory);
  };
  
  // Undo last boundary change
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setDrawnBoundaryPoints(boundaryHistory[historyIndex - 1]);
      setSelectedPointIndex(null);
    }
  };
  
  // Redo boundary change
  const handleRedo = () => {
    if (historyIndex < boundaryHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setDrawnBoundaryPoints(boundaryHistory[historyIndex + 1]);
      setSelectedPointIndex(null);
    }
  };
  
  // Toggle add mode for toolbar
  const handleToolbarAddMode = () => {
    setIsAddMode(!isAddMode);
    setIsDeleteMode(false);
    setSelectedPointIndex(null);
  };
  
  // Toggle delete mode for toolbar
  const handleToolbarDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setIsAddMode(false);
    setSelectedPointIndex(null);
  };

  // Copy coordinates to clipboard
  const handleCopyCoordinates = async () => {
    if (drawnBoundaryPoints.length === 0) return;
    
    // Format coordinates as simple lat, lng pairs (one per line)
    const coordinatesText = drawnBoundaryPoints
      .map((point) => `${point.lat.toFixed(7)}, ${point.lng.toFixed(7)}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(coordinatesText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000); // Hide feedback after 2 seconds
    } catch (err) {
      console.error('Failed to copy coordinates:', err);
    }
  };

  const handleMapContextMenu = (e: React.MouseEvent) => {
    if (!isEditMode || isDrawingBoundary || drawnBoundaryPoints.length === 0) return;
    
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pointIndex = getPointAtPosition(x, y);
    
    // Only show context menu when right-clicking an existing anchor point
    if (pointIndex === null) {
      setAnchorContextMenu(null);
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setHoveredPointIndex(pointIndex);
    
    // Keep menu inside map bounds
    const menuWidth = 170;
    const menuHeight = 36;
    const menuX = Math.min(Math.max(x + 8, 8), rect.width - menuWidth - 8);
    const menuY = Math.min(Math.max(y + 8, 8), rect.height - menuHeight - 8);
    
    setAnchorContextMenu({ x: menuX, y: menuY, pointIndex });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setAnchorContextMenu(null);
    
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Special case: during drawing, check if clicking near first point to close polygon
    if (isDrawingBoundary && drawnBoundaryPoints.length >= 3) {
      if (isNearFirstPoint(x, y)) {
        // Don't handle this here - let handleMouseUp handle it via handleMapClickForBoundary
        setDragStart({ x: e.clientX, y: e.clientY });
        return;
      }
    }
    
    // Check if clicking on a boundary point (when in edit mode OR during drawing with delete mode)
    if ((isEditMode || isDrawingBoundary) && drawnBoundaryPoints.length > 0) {
      const pointIndex = getPointAtPosition(x, y);
      if (pointIndex !== null) {
        // If in delete mode, delete the point
        if (isDeleteMode && drawnBoundaryPoints.length > 3) {
          e.preventDefault();
          e.stopPropagation();
          deleteBoundaryPoint(pointIndex);
          return;
        }
        
        // Option/Alt + Click to delete point (only in edit mode, not during drawing)
        if (!isDrawingBoundary && (e.altKey || isAltKeyPressed) && e.button === 0) {
          e.preventDefault();
          e.stopPropagation();
          deleteBoundaryPoint(pointIndex);
          return;
        }
        
        // During drawing mode, don't allow dragging existing points (unless in delete mode which was handled above)
        if (isDrawingBoundary) {
          return;
        }

        // Click to select point (always) or start dragging (only in edit mode)
        e.preventDefault();
        e.stopPropagation();
        setSelectedCoordinateIndex(pointIndex);
        
        if (isEditMode) {
          setSelectedPointIndex(pointIndex);
          setIsDraggingPoint(true);
          setDraggedPointIndex(pointIndex);
          setDragStart({ x: e.clientX, y: e.clientY });
        }
        return;
      } else {
        // Clicked elsewhere, deselect
        setSelectedPointIndex(null);
        setSelectedCoordinateIndex(null);
      }
      
      // Check if clicking on a line segment to add new point (only in edit mode, not drawing, and not in delete mode)
      if (!isDrawingBoundary && isEditMode && !isDeleteMode) {
        const lineSegment = getLineSegmentAtPosition(x, y);
        if (lineSegment) {
          e.preventDefault();
          e.stopPropagation();
          
          // Save to history before adding point
          saveToHistory(drawnBoundaryPoints);
          
          // Convert screen coordinates to geographic coordinates
          const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
          const worldX = centerPoint.x - (rect.width / 2) + lineSegment.position.x;
          const worldY = centerPoint.y - (rect.height / 2) + lineSegment.position.y;
          const geo = unproject(worldX, worldY, viewState.zoom);
          
          // Insert the new point at the correct position
          setDrawnBoundaryPoints(prev => {
            const newPoints = [...prev];
            newPoints.splice(lineSegment.insertIndex, 0, geo);
            return newPoints;
          });
          
          // Highlight the newly added point
          setSelectedCoordinateIndex(lineSegment.insertIndex);
          
          // Start dragging the newly created point
          setIsDraggingPoint(true);
          setDraggedPointIndex(lineSegment.insertIndex);
          setDragStart({ x: e.clientX, y: e.clientY });
          setHoveredLinePosition(null);
          return;
        }
      }
    }
    
    // If in selection mode, handle click for location selection
    if (isMapSelectionMode) {
      handleMapClickForSelection(e);
      return;
    }
    
    // If in boundary drawing mode, don't start dragging - let click handle it
    if (isDrawingBoundary) {
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartCenter({ lat: viewState.lat, lng: viewState.lng });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update hover state for boundary points (when in edit mode OR delete mode, and not drawing or dragging)
    if (!isDragging && !isDraggingPoint && drawnBoundaryPoints.length > 0 && (isEditMode || isDeleteMode)) {
      const pointIndex = getPointAtPosition(x, y);
      setHoveredPointIndex(pointIndex);
      
      // Check for line segment hover (only if not hovering over a point and in edit mode, not delete mode)
      if (pointIndex === null && isEditMode && !isDrawingBoundary && !isDeleteMode) {
        const lineSegment = getLineSegmentAtPosition(x, y);
        setHoveredLinePosition(lineSegment);
      } else {
        setHoveredLinePosition(null);
      }
    } else if (!isEditMode && !isDeleteMode) {
      setHoveredPointIndex(null);
      setHoveredLinePosition(null);
    }
    
    // Handle point dragging
    if (isDraggingPoint && draggedPointIndex !== null) {
      // Convert screen coordinates to geographic coordinates
      const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
      const worldX = centerPoint.x - (rect.width / 2) + x;
      const worldY = centerPoint.y - (rect.height / 2) + y;
      const geo = unproject(worldX, worldY, viewState.zoom);
      
      // Update the dragged point
      setDrawnBoundaryPoints(prev => {
        const newPoints = [...prev];
        newPoints[draggedPointIndex] = geo;
        return newPoints;
      });
      return;
    }
    
    // Update cursor position for rubber band line
    if (isDrawingBoundary) {
      setCursorPosition({ x, y });
      
      // Check if near first point to update cursor state
      setIsNearFirstPointHover(isNearFirstPoint(x, y));
    }
    
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const centerPoint = project(dragStartCenter.lat, dragStartCenter.lng, viewState.zoom);
      const newCenterWorld = { x: centerPoint.x - dx, y: centerPoint.y - dy };
      const newCenterGeo = unproject(newCenterWorld.x, newCenterWorld.y, viewState.zoom);
      setViewState(prev => ({ ...prev, lat: newCenterGeo.lat, lng: newCenterGeo.lng }));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingPoint) {
      // Save to history after dragging point
      saveToHistory(drawnBoundaryPoints);
      setIsDraggingPoint(false);
      setDraggedPointIndex(null);
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    
    // Handle boundary point addition on click (not drag)
    if (isDrawingBoundary) {
      const dist = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
      if (dist < 5) {
        // It's a click, not a drag
        handleMapClickForBoundary(e);
      }
    }
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setViewState(prev => ({ ...prev, zoom: Math.min(Math.max(prev.zoom + delta, 2), 20) }));
  };

  // Search functionality
  const calculateZoomFromBounds = (
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    width: number,
    height: number
  ) => {
    for (let z = 18; z >= 2; z--) {
      const sw = project(minLat, minLng, z);
      const ne = project(maxLat, maxLng, z);
      const boundsWidth = Math.abs(ne.x - sw.x);
      const boundsHeight = Math.abs(sw.y - ne.y);
      if (boundsWidth <= width * 0.9 && boundsHeight <= height * 0.9) {
        return z;
      }
    }
    return 2;
  };

  const handleResultSelect = (result: any) => {
    let bbox: [number, number, number, number] | undefined = undefined;
    let newZoom = 14;

    if (result.boundingbox && Array.isArray(result.boundingbox) && result.boundingbox.length === 4) {
      bbox = [
        parseFloat(result.boundingbox[0]),
        parseFloat(result.boundingbox[1]),
        parseFloat(result.boundingbox[2]),
        parseFloat(result.boundingbox[3])
      ];
      
      if (mapDimensions.width > 0 && mapDimensions.height > 0) {
        newZoom = calculateZoomFromBounds(bbox[0], bbox[1], bbox[2], bbox[3], mapDimensions.width, mapDimensions.height);
      }
    }

    setViewState(prev => ({ ...prev, lat: parseFloat(result.lat), lng: parseFloat(result.lon), zoom: newZoom }));
    setSearchQuery(result.display_name);
    setSelectedLocationName(result.display_name);
    setSelectedLocationMarker({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setShowResults(false);
    setIsInputFocused(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setShowResults(false);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        if (data.length === 1) {
          handleResultSelect(data[0]);
        } else {
          setSearchResults(data);
          setShowResults(true);
        }
      } else {
        setSearchError("Location not found");
      }
    } catch (err) {
      setSearchError("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // Get user's location
  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Show loading state
    setIsSearching(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setViewState(prev => ({
          ...prev,
          lat: lat,
          lng: lng,
          zoom: 14
        }));
        setSelectedLocationMarker({ lat, lng });
        
        // Try to get place name via reverse geocoding
        const placeName = await reverseGeocode(lat, lng);
        
        if (placeName) {
          // Use the place name if found
          setSearchQuery(placeName);
          setSelectedLocationName(placeName);
        } else {
          // Fallback to coordinates if reverse geocoding fails
          const coordStr = `${formatLatForDisplay(lat)}, ${formatLongForDisplay(lng)}`;
          setSearchQuery(coordStr);
          setSelectedLocationName(coordStr);
        }
        
        setIsSearching(false);
      },
      (error) => {
        setIsSearching(false);
        alert("Unable to retrieve your location");
      }
    );
  };

  // Clear selected location
  const handleClearLocation = () => {
    setSelectedLocationMarker(null);
    setSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[90vw] h-[85vh] max-w-[1400px] bg-white shadow-xl rounded-[2px]">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#d0d0d7]">
          <h2 className="text-[20px] font-bold text-[#363545] m-0">Project boundary</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <div className="w-[400px] flex flex-col border-r border-[#d0d0d7] bg-white relative overflow-hidden">
            {/* Upload File Mode */}
            {isUploadFileMode ? (
              <div 
                className="absolute inset-0 bg-white flex flex-col z-10"
                style={{
                  animation: 'slideInFromRight 0.3s ease-out forwards'
                }}
              >
                {/* Header with Back Button */}
                <div className="p-6 border-b border-[#d0d0d7]">
                  <button 
                    onClick={handleBackFromUploadFile}
                    className="flex items-center gap-2 text-[#005f9e] hover:text-[#00437b] mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[14px] font-semibold">Upload Boundary from File</span>
                  </button>
                  <p className="text-[13px] text-[#6a6976] mb-2">
                    Upload a local file to define the project boundary. Supported formats: <span className="font-mono text-[12px] bg-[#eaeaef] px-1.5 py-0.5 rounded">.csv</span>, <span className="font-mono text-[12px] bg-[#eaeaef] px-1.5 py-0.5 rounded">.dxf</span>.
                  </p>
                </div>

                {/* File Upload Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.dxf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div 
                    onClick={handleUploadAreaClick}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const fakeEvent = {
                          target: { files: [file] }
                        } as any;
                        handleFileSelect(fakeEvent);
                      }
                    }}
                    className="w-full border-2 border-dashed border-[#d0d0d7] rounded-[2px] p-8 flex flex-col items-center justify-center gap-4 hover:border-[#005f9e] hover:bg-[#f9f9fb] transition-colors cursor-pointer"
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-[#eaeaef] rounded-full">
                      <Upload className="w-8 h-8 text-[#6a6976]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold text-[#005f9e] mb-1">
                        Click to browse files
                      </p>
                      <p className="text-[12px] text-[#6a6976]">
                        or drag and drop here
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer with Cancel Button */}
                <div className="p-6 border-t border-[#d0d0d7] bg-[#f9f9fb] flex justify-end gap-4">
                  <button 
                    onClick={handleBackFromUploadFile}
                    className="text-[#005f9e] text-[14px] font-bold hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : isInputCoordinatesMode ? (
              <div 
                className="absolute inset-0 bg-white flex flex-col z-10"
                style={{
                  animation: 'slideInFromRight 0.3s ease-out forwards'
                }}
              >
                {/* Header shown only during stage 1 */}
                {!showCoordinateCard && (
                  <div className="p-6 border-b border-[#d0d0d7]">
                    <button 
                      onClick={handleBackFromCoordinateInput}
                      className="flex items-center gap-2 text-[#005f9e] hover:text-[#00437b] mb-4"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-[14px] font-semibold">Input Boundary Coordinates</span>
                    </button>
                    <p className="text-[13px] text-[#6a6976]">
                      Paste or enter coordinates into the box below
                    </p>
                  </div>
                )}

                {/* Coordinate Input Textarea and Table */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                  {/* Swap Suggestion Banner */}
                  {showSwapSuggestion && (
                    <div className="bg-[#fff4e6] border border-[#ffb84d] rounded-[2px] p-3 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#ff8c00] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[13px] text-[#8b4500] font-semibold mb-1">
                          Coordinates may be in wrong order
                        </p>
                        <p className="text-[12px] text-[#8b4500] mb-2">
                          Detected: (Longitude, Latitude) • Expected: (Latitude, Longitude)
                        </p>
                        <button
                          onClick={handleSwapColumns}
                          className="text-[12px] font-semibold text-[#005f9e] hover:underline"
                        >
                          Swap columns automatically
                        </button>
                      </div>
                      <button
                        onClick={() => setShowSwapSuggestion(false)}
                        className="text-[#8b4500] hover:text-[#5c2e00]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Stage 1: Input textarea always visible until user clicks review */}
                  {!showCoordinateCard && (
                    <div className="flex-shrink-0">
                      <label className="block text-[12px] font-semibold text-[#363545] mb-2">
                        Paste coordinates (one pair per line):
                      </label>
                      <textarea 
                        className="w-full h-[120px] border border-[#d0d0d7] p-3 text-[13px] text-[#363545] font-mono rounded-[2px] outline-none focus:border-[#005f9e] bg-white placeholder:text-[#aeaeb6] placeholder:italic resize-none"
                        value={coordinateInputValue}
                        onChange={(e) => setCoordinateInputValue(e.target.value)}
                        placeholder={coordinateFormat === 'geo'
                          ? "47.8407339, 9.2079866\n48.0871734, 9.9550569\n48.3579946, 9.1970003"
                          : "514300.500, 5301200.700\n514350.200, 5301250.100\n514400.800, 5301200.300"}
                        style={{ whiteSpace: 'pre-line' }}
                      />
                    </div>
                  )}
                  
                  {/* Stage 1 action: becomes active when valid coordinates are parsed */}
                  {!showCoordinateCard && (
                    <button
                      onClick={() => {
                        // Move to stage 2 and show boundary preview on map
                        setShowCoordinateCard(true);
                        setIsEditMode(true);
                        setDrawnBoundaryPoints(parsedCoordinates);

                        // Fit map to submitted coordinates at stage transition
                        if (parsedCoordinates.length >= 2) {
                          const lats = parsedCoordinates.map(p => p.lat);
                          const lngs = parsedCoordinates.map(p => p.lng);
                          const minLat = Math.min(...lats);
                          const maxLat = Math.max(...lats);
                          const minLng = Math.min(...lngs);
                          const maxLng = Math.max(...lngs);
                          const centerLat = (minLat + maxLat) / 2;
                          const centerLng = (minLng + maxLng) / 2;
                          const newZoom = calculateZoomFromBounds(minLat, maxLat, minLng, maxLng, mapDimensions.width, mapDimensions.height);
                          setViewState({ lat: centerLat, lng: centerLng, zoom: newZoom });
                        }
                      }}
                      disabled={parsedCoordinates.length < 3}
                      className={`w-full py-2.5 px-4 text-[13px] font-semibold rounded-[2px] border transition-colors ${
                        parsedCoordinates.length >= 3
                          ? 'bg-white border-[#d0d0d7] text-[#363545] hover:bg-[#f9f9fb]'
                          : 'bg-[#f9f9fb] border-[#d0d0d7] text-[#aeaeb6] cursor-not-allowed'
                      }`}
                    >
                      {parsedCoordinates.length >= 3
                        ? `Submit coordinates (${parsedCoordinates.length})`
                        : 'Submit coordinates'}
                    </button>
                  )}

                  {/* Parsed Coordinates Table - only show after clicking review button */}
                  {parsedCoordinates.length > 0 && showCoordinateCard && (
                    <div className="bg-[#f9f9fb] border border-[#d0d0d7] rounded-[2px] p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-[#eaeaef] rounded-[2px] flex-shrink-0">
                            <img src="/icons/PhPolygon.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(21%) sepia(8%) saturate(1015%) hue-rotate(215deg) brightness(95%) contrast(92%)' }} />
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold text-[#363545] mb-1">Project Boundary</h4>
                            <p className="text-[12px] text-[#6a6976]">
                              {parsedCoordinates.length} points defined.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Edit button - pencil icon */}
                          {parsedCoordinates.length >= 3 && (
                            <button
                              onClick={() => {
                                setIsEditMode(!isEditMode);
                                if (isEditMode) {
                                  // Clear selection when exiting edit mode
                                  setSelectedCoordinateIndex(null);
                                  setSelectedPointIndex(null);
                                }
                              }}
                              className={`p-1 rounded-[2px] ${isEditMode ? 'text-[#005f9e] bg-[#e5f0f8]' : 'text-[#6a6976] hover:text-[#363545]'}`}
                              title={isEditMode ? "Done editing" : "Edit boundary"}
                            >
                              {isEditMode ? <Check className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                            </button>
                          )}
                          {/* Copy coordinates button */}
                          {parsedCoordinates.length > 0 && (
                            <button
                              onClick={handleCopyCoordinates}
                              className={`p-1 rounded-[2px] ${copyFeedback ? 'text-[#00a651] bg-[#e8f5ed]' : 'text-[#6a6976] hover:text-[#363545]'}`}
                              title={copyFeedback ? "Copied!" : "Copy coordinates"}
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                          {/* Clear/Trash Button */}
                          <button
                            onClick={() => {
                              setCoordinateInputValue("");
                              setParsedCoordinates([]);
                              setDrawnBoundaryPoints([]);
                              setShowSwapSuggestion(false);
                              setShowCoordinateCard(false);
                            }}
                            className="text-[#6a6976] hover:text-[#363545] p-1"
                            title="Clear all coordinates"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Column Headers */}
                      {parsedCoordinates.length > 0 && (
                        <div className="mt-4">
                          {/* Toggle buttons for coordinate format */}
                          <div className="flex bg-[#eaeaef] rounded-[2px] p-[2px] w-fit">
                            <button 
                              onClick={() => setCoordinateFormat('geo')}
                              className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${coordinateFormat === 'geo' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976] hover:bg-[#d0d0d7]/50'}`}
                              title="View as geographic coordinates (Latitude, Longitude)"
                            >
                              (φ,λ)
                            </button>
                            <button 
                              onClick={() => hasProjectedCRS && setCoordinateFormat('proj')}
                              className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${coordinateFormat === 'proj' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976]'} ${!hasProjectedCRS ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#d0d0d7]/50'}`}
                              title={hasProjectedCRS ? "View as projected coordinates (Easting, Northing)" : "Projected coordinates require a CRS to be selected"}
                              disabled={!hasProjectedCRS}
                            >
                              (E,N)
                            </button>
                          </div>
                          
                          {/* Divider line */}
                          <div className="border-b border-[#d0d0d7] mb-3"></div>
                          
                          {/* Column header labels */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6a6976] uppercase tracking-wide">
                            <span className="w-4 select-none"></span>
                            {coordinateFormat === 'geo' ? (
                              <>
                                <span className="w-[90px] px-1">Latitude</span>
                                <span className="w-2 select-none"></span>
                                <span className="w-[90px] px-1">Longitude</span>
                              </>
                            ) : (
                              <>
                                <span className="w-[110px] px-1">{getCRSAxisOrder(activeCRS?.code || '') === 'EN' ? `Easting (${getUnitAbbreviation(activeCRS?.unit || 'm')})` : `Northing (${getUnitAbbreviation(activeCRS?.unit || 'm')})`}</span>
                                <span className="w-2 select-none"></span>
                                <span className="w-[110px] px-1">{getCRSAxisOrder(activeCRS?.code || '') === 'EN' ? `Northing (${getUnitAbbreviation(activeCRS?.unit || 'm')})` : `Easting (${getUnitAbbreviation(activeCRS?.unit || 'm')})`}</span>
                              </>
                            )}
                            {/* Swap button above the X column - only show in edit mode and geo format */}
                            {isEditMode && coordinateFormat === 'geo' && (
                              <button
                                onClick={handleSwapColumns}
                                className="ml-1 p-0.5 rounded-[2px] text-[#6a6976] hover:text-[#005f9e] hover:bg-[#e5f0f8] transition-colors"
                                title="Swap latitude and longitude columns"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Coordinate List - editable when in edit mode */}
                      {parsedCoordinates.length > 0 && (
                        <div className="space-y-1 max-h-[300px] overflow-y-auto mt-3">
                          {parsedCoordinates.map((coord, index) => {
                            // Get display values based on format
                            const displayValues = coordinateFormat === 'proj' && displayProjectedCoords[index]
                              ? (getCRSAxisOrder(activeCRS?.code || '') === 'EN'
                                  ? { first: displayProjectedCoords[index].easting, second: displayProjectedCoords[index].northing }
                                  : { first: displayProjectedCoords[index].northing, second: displayProjectedCoords[index].easting })
                              : { first: coord.lat, second: coord.lng };
                            
                            const decimals = coordinateFormat === 'proj' ? 3 : 7;
                            const unit = coordinateFormat === 'proj' && activeCRS ? ` ${getUnitAbbreviation(activeCRS.unit)}` : '';
                            
                            return isEditMode ? (
                              <div 
                                key={index} 
                                onClick={() => setSelectedCoordinateIndex(index)}
                                className="flex items-center gap-1 text-[12px] text-[#363545] font-mono"
                              >
                                <span className="text-[#6a6976] w-4 select-none">{index + 1}.</span>
                                <input
                                  type="text"
                                  className={`${coordinateFormat === 'proj' ? 'w-[110px]' : 'w-[90px]'} px-1 py-0.5 border rounded-[2px] text-[12px] font-mono outline-none bg-white transition-all ${
                                    selectedCoordinateIndex === index
                                      ? 'border-[#005f9e] border-2 shadow-sm'
                                      : 'border-[#d0d0d7] focus:border-[#005f9e]'
                                  }`}
                                  value={displayValues.first.toFixed(decimals)}
                                  onChange={(e) => handleUpdateCoordinate(index, 'lat', e.target.value)}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) {
                                      e.target.value = val.toFixed(decimals);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  readOnly={coordinateFormat === 'proj'}
                                  title={coordinateFormat === 'proj' ? 'Edit in geographic mode' : ''}
                                />
                                <span className="select-none">,</span>
                                <input
                                  type="text"
                                  className={`${coordinateFormat === 'proj' ? 'w-[110px]' : 'w-[90px]'} px-1 py-0.5 border rounded-[2px] text-[12px] font-mono outline-none bg-white transition-all ${
                                    selectedCoordinateIndex === index
                                      ? 'border-[#005f9e] border-2 shadow-sm'
                                      : 'border-[#d0d0d7] focus:border-[#005f9e]'
                                  }`}
                                  value={displayValues.second.toFixed(decimals)}
                                  onChange={(e) => handleUpdateCoordinate(index, 'lng', e.target.value)}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) {
                                      e.target.value = val.toFixed(decimals);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  readOnly={coordinateFormat === 'proj'}
                                  title={coordinateFormat === 'proj' ? 'Edit in geographic mode' : ''}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCoordinatePair(index)}
                                  disabled={parsedCoordinates.length <= 3}
                                  className={`ml-1 p-1 rounded-[2px] transition-colors ${
                                    parsedCoordinates.length <= 3
                                      ? 'text-[#aeaeb6] cursor-not-allowed'
                                      : 'text-[#6a6976] hover:text-[#a51d25] hover:bg-[#f3f3f7]'
                                  }`}
                                  title={
                                    parsedCoordinates.length <= 3
                                      ? 'A boundary requires at least 3 coordinate pairs'
                                      : 'Delete coordinate pair'
                                  }
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                key={index} 
                                onClick={() => setSelectedCoordinateIndex(index)}
                                className="flex items-center gap-1 text-[12px] text-[#363545] font-mono cursor-pointer"
                              >
                                <span className="text-[#6a6976] w-4 select-none">{index + 1}.</span>
                                <span className={`${coordinateFormat === 'proj' ? 'w-[110px]' : 'w-[90px]'} px-1 py-0.5 rounded-[2px] border transition-all ${
                                  selectedCoordinateIndex === index 
                                    ? 'border-[#005f9e] border-2 shadow-sm bg-white' 
                                    : 'border-transparent hover:bg-[#f3f3f7]'
                                }`}>{displayValues.first.toFixed(decimals)}{unit}</span>
                                <span className="select-none">,</span>
                                <span className={`${coordinateFormat === 'proj' ? 'w-[110px]' : 'w-[90px]'} px-1 py-0.5 rounded-[2px] border transition-all ${
                                  selectedCoordinateIndex === index 
                                    ? 'border-[#005f9e] border-2 shadow-sm bg-white' 
                                    : 'border-transparent hover:bg-[#f3f3f7]'
                                }`}>{displayValues.second.toFixed(decimals)}{unit}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer with Cancel and Save Buttons */}
                <div className="p-6 border-t border-[#d0d0d7] bg-[#f9f9fb] flex justify-end gap-4">
                  <button 
                    onClick={handleBackFromCoordinateInput}
                    className="text-[#005f9e] text-[14px] font-bold hover:underline"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveCoordinates}
                    className="bg-[#005f9e] hover:bg-[#00437b] text-white text-[14px] font-bold py-2.5 px-6 rounded-[2px]"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
            {/* Project Boundary Section */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Show Project Boundary Card when drawing or has points */}
              {(isDrawingBoundary || drawnBoundaryPoints.length > 0) ? (
                <div className="bg-[#f9f9fb] border border-[#d0d0d7] rounded-[2px] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-[#eaeaef] rounded-[2px] flex-shrink-0">
                        <img src="/icons/PhPolygon.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(21%) sepia(8%) saturate(1015%) hue-rotate(215deg) brightness(95%) contrast(92%)' }} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-semibold text-[#363545] mb-1">Project Boundary</h4>
                        <p className="text-[12px] text-[#6a6976]">
                          {drawnBoundaryPoints.length} points defined.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Edit button - pencil icon */}
                      {drawnBoundaryPoints.length >= 3 && !isDrawingBoundary && (
                        <button
                          onClick={() => {
                            setIsEditMode(!isEditMode);
                            if (isEditMode) {
                              // Clear selection when exiting edit mode
                              setSelectedCoordinateIndex(null);
                              setSelectedPointIndex(null);
                            }
                          }}
                          className={`p-1 rounded-[2px] ${isEditMode ? 'text-[#005f9e] bg-[#e5f0f8]' : 'text-[#6a6976] hover:text-[#363545]'}`}
                          title={isEditMode ? "Done editing" : "Edit boundary"}
                        >
                          {isEditMode ? <Check className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                        </button>
                      )}
                      {/* Copy coordinates button */}
                      {drawnBoundaryPoints.length > 0 && (
                        <button
                          onClick={handleCopyCoordinates}
                          className={`p-1 rounded-[2px] ${copyFeedback ? 'text-[#00a651] bg-[#e8f5ed]' : 'text-[#6a6976] hover:text-[#363545]'}`}
                          title={copyFeedback ? "Copied!" : "Copy coordinates"}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={handleCancelDrawing}
                        className="text-[#6a6976] hover:text-[#363545] p-1"
                        title="Clear boundary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Column Headers with Toggle */}
                  {drawnBoundaryPoints.length > 0 && (
                    <div className="mt-4">
                      {/* Toggle buttons for coordinate format */}
                      <div className="flex bg-[#eaeaef] rounded-[2px] p-[2px] w-fit">
                        <button 
                          onClick={() => setCoordinateFormat('geo')}
                          className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${coordinateFormat === 'geo' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976] hover:bg-[#d0d0d7]/50'}`}
                          title="View as geographic coordinates (Latitude, Longitude)"
                        >
                          (φ,λ)
                        </button>
                        <button 
                          onClick={() => hasProjectedCRS && setCoordinateFormat('proj')}
                          className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${coordinateFormat === 'proj' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976]'} ${!hasProjectedCRS ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#d0d0d7]/50'}`}
                          title={hasProjectedCRS ? "View as projected coordinates (Easting, Northing)" : "Projected coordinates require a CRS to be selected"}
                          disabled={!hasProjectedCRS}
                        >
                          (E,N)
                        </button>
                      </div>
                      
                      {/* Divider line */}
                      <div className="border-b border-[#d0d0d7] mb-3"></div>
                      
                      {/* Column header labels */}
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6a6976] uppercase tracking-wide">
                        <span className="w-4 select-none"></span>
                        {coordinateFormat === 'geo' ? (
                          <>
                            <span className="w-[90px] px-1">Latitude</span>
                            <span className="w-2 select-none"></span>
                            <span className="w-[90px] px-1">Longitude</span>
                          </>
                        ) : (
                          <>
                            <span className="w-[110px] px-1">{getCRSAxisOrder(activeCRS?.code || '') === 'EN' ? `Easting (${getUnitAbbreviation(activeCRS?.unit || 'm')})` : `Northing (${getUnitAbbreviation(activeCRS?.unit || 'm')})`}</span>
                            <span className="w-2 select-none"></span>
                            <span className="w-[110px] px-1">{getCRSAxisOrder(activeCRS?.code || '') === 'EN' ? `Northing (${getUnitAbbreviation(activeCRS?.unit || 'm')})` : `Easting (${getUnitAbbreviation(activeCRS?.unit || 'm')})`}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Coordinate List - editable when in edit mode */}
                  {drawnBoundaryPoints.length > 0 && (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto mt-3">
                      {drawnBoundaryPoints.map((point, index) => {
                        // Get display values based on format
                        const displayValues = coordinateFormat === 'proj' && displayDrawnProjectedCoords[index]
                          ? (getCRSAxisOrder(activeCRS?.code || '') === 'EN'
                              ? { first: displayDrawnProjectedCoords[index].easting, second: displayDrawnProjectedCoords[index].northing }
                              : { first: displayDrawnProjectedCoords[index].northing, second: displayDrawnProjectedCoords[index].easting })
                          : { first: point.lat, second: point.lng };
                        
                        const decimals = coordinateFormat === 'proj' ? 3 : 7;
                        const unit = coordinateFormat === 'proj' && activeCRS ? ` ${getUnitAbbreviation(activeCRS.unit)}` : '';
                        
                        return isEditMode ? (
                          <div 
                            key={index} 
                            onClick={() => setSelectedCoordinateIndex(index)}
                            className="flex items-center gap-1 text-[12px] text-[#363545] font-mono"
                          >
                            <span className="text-[#6a6976] w-4 select-none">{index + 1}.</span>
                            <input
                              type="text"
                              className={`${coordinateFormat === 'proj' ? 'w-[110px]' : 'w-[90px]'} px-1 py-0.5 border rounded-[2px] text-[12px] font-mono outline-none bg-white transition-all ${
                                selectedCoordinateIndex === index
                                  ? 'border-[#005f9e] border-2 shadow-sm'
                                  : 'border-[#d0d0d7] focus:border-[#005f9e]'
                              }`}
                              value={displayValues.first.toFixed(decimals)}
                              onChange={(e) => {
                                // Only allow editing in geographic mode
                                if (coordinateFormat === 'geo') {
                                  const newLat = parseFloat(e.target.value);
                                  if (!isNaN(newLat)) {
                                    setDrawnBoundaryPoints(prev => {
                                      const newPoints = [...prev];
                                      newPoints[index] = { ...newPoints[index], lat: newLat };
                                      return newPoints;
                                    });
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              readOnly={coordinateFormat === 'proj'}
                              title={coordinateFormat === 'proj' ? 'Edit in geographic mode' : ''}
                            />
                            <span className="select-none">,</span>
                            <input
                              type="text"
                              className={`${coordinateFormat === 'proj' ? 'w-[110px]' : 'w-[90px]'} px-1 py-0.5 border rounded-[2px] text-[12px] font-mono outline-none bg-white transition-all ${
                                selectedCoordinateIndex === index
                                  ? 'border-[#005f9e] border-2 shadow-sm'
                                  : 'border-[#d0d0d7] focus:border-[#005f9e]'
                              }`}
                              value={displayValues.second.toFixed(decimals)}
                              onChange={(e) => {
                                // Only allow editing in geographic mode
                                if (coordinateFormat === 'geo') {
                                  const newLng = parseFloat(e.target.value);
                                  if (!isNaN(newLng)) {
                                    setDrawnBoundaryPoints(prev => {
                                      const newPoints = [...prev];
                                      newPoints[index] = { ...newPoints[index], lng: newLng };
                                      return newPoints;
                                    });
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              readOnly={coordinateFormat === 'proj'}
                              title={coordinateFormat === 'proj' ? 'Edit in geographic mode' : ''}
                            />
                            <button
                              type="button"
                              onClick={() => deleteBoundaryPoint(index)}
                              disabled={drawnBoundaryPoints.length <= 3}
                              className={`ml-1 p-1 rounded-[2px] transition-colors ${
                                drawnBoundaryPoints.length <= 3
                                  ? 'text-[#aeaeb6] cursor-not-allowed'
                                  : 'text-[#6a6976] hover:text-[#a51d25] hover:bg-[#f3f3f7]'
                              }`}
                              title={
                                drawnBoundaryPoints.length <= 3
                                  ? 'A boundary requires at least 3 points'
                                  : 'Delete anchor point'
                              }
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            key={index} 
                            onClick={() => setSelectedCoordinateIndex(index)}
                            className="flex items-center gap-1 text-[12px] text-[#363545] font-mono cursor-pointer"
                          >
                            <span className="text-[#6a6976] w-4 select-none">{index + 1}.</span>
                            <span className={`${coordinateFormat === 'proj' ? 'w-[110px]' : 'w-[90px]'} px-1 py-0.5 rounded-[2px] border transition-all ${
                              selectedCoordinateIndex === index 
                                ? 'border-[#005f9e] border-2 shadow-sm bg-white' 
                                : 'border-transparent hover:bg-[#f3f3f7]'
                            }`}>{displayValues.first.toFixed(decimals)}{unit}</span>
                            <span className="select-none">,</span>
                            <span className={`${coordinateFormat === 'proj' ? 'w-[110px]' : 'w-[90px]'} px-1 py-0.5 rounded-[2px] border transition-all ${
                              selectedCoordinateIndex === index 
                                ? 'border-[#005f9e] border-2 shadow-sm bg-white' 
                                : 'border-transparent hover:bg-[#f3f3f7]'
                            }`}>{displayValues.second.toFixed(decimals)}{unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Action Cards - shown when not drawing */
                <div className="space-y-4">
                  {/* Instructional paragraph */}
                  <p className="text-[13px] text-[#6a6976] leading-relaxed">
                    Choose one of the options below to define your project boundary.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Draw Boundary Card */}
                    <button
                      onClick={handleStartDrawing}
                      className="w-full flex items-start gap-3 p-4 border border-[#d0d0d7] rounded-[2px] hover:bg-[#f9f9fb] transition-colors text-left"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-[#eaeaef] rounded-[2px] flex-shrink-0">
                        <PenTool className="w-5 h-5 text-[#363545]" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-semibold text-[#363545] mb-1">Draw Boundary on Map</h4>
                        <p className="text-[12px] text-[#6a6976]">
                          Click on the map to draw a polygon defining your project boundary
                        </p>
                      </div>
                    </button>

                  {/* Input Coordinates Card */}
                  <button
                    onClick={handleOpenCoordinateInput}
                    className="w-full flex items-start gap-3 p-4 border border-[#d0d0d7] rounded-[2px] hover:bg-[#f9f9fb] transition-colors text-left"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-[#eaeaef] rounded-[2px] flex-shrink-0">
                      <Keyboard className="w-5 h-5 text-[#363545]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#363545] mb-1">Input Boundary coordinates</h4>
                      <p className="text-[12px] text-[#6a6976]">
                        Enter coordinates manually as latitude/longitude or projected coordinates
                      </p>
                    </div>
                  </button>

                  {/* Upload File Card */}
                  <button
                    onClick={handleOpenUploadFile}
                    className="w-full flex items-start gap-3 p-4 border border-[#d0d0d7] rounded-[2px] hover:bg-[#f9f9fb] transition-colors text-left"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-[#eaeaef] rounded-[2px] flex-shrink-0">
                      <Upload className="w-5 h-5 text-[#363545]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#363545] mb-1">Upload boundary from file</h4>
                      <p className="text-[12px] text-[#6a6976]">
                        Import boundary data from KML, GeoJSON, or other supported file formats
                      </p>
                    </div>
                  </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Cancel and Save Buttons */}
            <div className="p-6 border-t border-[#d0d0d7] bg-[#f9f9fb] flex justify-end gap-4">
              <button 
                onClick={onClose}
                className="text-[#005f9e] text-[14px] font-bold hover:underline"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges}
                className="bg-[#005f9e] hover:bg-[#00437b] text-white text-[14px] font-bold py-2.5 px-6 rounded-[2px]"
              >
                Save changes
              </button>
            </div>
              </div>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="flex-1 relative bg-[#e6e6e6] overflow-hidden">
            {/* Custom cursor styles */}
            <style>{`
              .cursor-pointer-hand {
                cursor: pointer !important;
              }
              .cursor-pointer-hand-plus {
                cursor: pointer !important;
              }
              .cursor-pointer-hand-minus {
                cursor: pointer !important;
              }
              .cursor-pen-tool {
                cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="%23005f9e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a.5.5 0 0 0-.498.112.5.5 0 0 0-.112.498l3.32 12.644a1 1 0 0 0 .776.746L13 17.5"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/></svg>') 12 12, crosshair !important;
              }
            `}</style>
            <div
              ref={mapContainerRef}
              className={`w-full h-full overflow-hidden ${
                isMapSelectionMode ? 'cursor-pen-tool' : 
                isDrawingBoundary ? (isNearFirstPointHover ? 'cursor-pointer' : 'cursor-pen-tool') : 
                isDraggingPoint ? 'cursor-grabbing' :
                isDragging ? 'cursor-grabbing' :
                isDeleteMode ? 'cursor-pen-tool' :
                (isEditMode && hoveredPointIndex !== null && isAltKeyPressed) ? 'cursor-pointer-hand-minus' :
                (isEditMode && hoveredPointIndex !== null && isAddMode) ? 'cursor-pointer-hand' :
                (isEditMode && hoveredPointIndex !== null) ? 'cursor-pointer-hand' :
                isAddMode ? 'cursor-pen-tool' :
                (isEditMode && hoveredLinePosition !== null) ? 'cursor-pen-tool' :
                'cursor-grab'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onContextMenu={handleMapContextMenu}
              onMouseLeave={() => {
                if (isDragging) setIsDragging(false);
                if (isDraggingPoint) {
                  setIsDraggingPoint(false);
                  setDraggedPointIndex(null);
                }
                setCursorPosition(null);
                setIsNearFirstPointHover(false);
                setHoveredPointIndex(null);
                setHoveredLinePosition(null);
                setAnchorContextMenu(null);
              }}
            >
              {isMapSelectionMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#005f9e] text-white px-4 py-2 rounded-[2px] shadow-lg z-30 text-[13px] font-semibold">
                  Click on the map to select location
                </div>
              )}
              
              {/* Drawing Mode Message - only show before first point is placed */}
              {isDrawingBoundary && drawnBoundaryPoints.length === 0 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#005f9e] text-white px-4 py-2 rounded-[2px] shadow-lg z-30 text-[13px] font-semibold">
                  Draw your boundary in the map
                </div>
              )}
              
              {/* Vertical Floating Toolbar - shown when drawing or in edit mode */}
              {((isDrawingBoundary && drawnBoundaryPoints.length > 0) || (isEditMode && drawnBoundaryPoints.length >= 3)) && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 bg-white border border-[#d0d0d7] rounded-[2px] shadow-lg p-1">
                  {/* Add Point Button - only show in edit mode */}
                  {isEditMode && !isDrawingBoundary && (
                    <button
                      onClick={handleToolbarAddMode}
                      className={`p-2 rounded-[2px] transition-colors relative ${
                        isAddMode 
                          ? 'bg-[#005f9e] text-white' 
                          : 'text-[#363545] hover:bg-[#f3f3f7]'
                      }`}
                      title="Add anchor point (click on boundary line)"
                    >
                      <div className="relative w-5 h-5">
                        <PenTool className={`w-3.5 h-3.5 absolute top-0 left-0 ${isAddMode ? 'text-white' : 'text-[#363545]'}`} strokeWidth={2} />
                        <Plus className={`w-2 h-2 absolute bottom-0 right-0 ${isAddMode ? 'text-white' : 'text-[#363545]'}`} strokeWidth={3} />
                      </div>
                    </button>
                  )}
                  
                  {/* Delete Point Button */}
                  <button
                    onClick={handleToolbarDeleteMode}
                    disabled={drawnBoundaryPoints.length <= 3}
                    className={`p-2 rounded-[2px] transition-colors relative ${
                      isDeleteMode
                        ? 'bg-[#005f9e] text-white'
                        : drawnBoundaryPoints.length <= 3
                        ? 'text-[#aeaeb6] cursor-not-allowed'
                        : 'text-[#363545] hover:bg-[#f3f3f7]'
                    }`}
                    title={
                      drawnBoundaryPoints.length <= 3
                        ? 'A boundary requires at least 3 points'
                        : isDeleteMode
                        ? 'Delete mode active - click an anchor point to delete'
                        : 'Delete anchor point (click to activate, then click a point)'
                    }
                  >
                    <div className="relative w-5 h-5">
                      <PenTool className={`w-3.5 h-3.5 absolute top-0 left-0 ${
                        isDeleteMode 
                          ? 'text-white' 
                          : drawnBoundaryPoints.length <= 3 
                          ? 'text-[#aeaeb6]' 
                          : 'text-[#363545]'
                      }`} strokeWidth={2} />
                      <Minus className={`w-2 h-2 absolute bottom-0 right-0 ${
                        isDeleteMode 
                          ? 'text-white' 
                          : drawnBoundaryPoints.length <= 3 
                          ? 'text-[#aeaeb6]' 
                          : 'text-[#363545]'
                      }`} strokeWidth={3} />
                    </div>
                  </button>
                  
                  <div className="h-px bg-[#d0d0d7] my-1" />
                  
                  {/* Undo Button */}
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className={`p-2 rounded-[2px] transition-colors ${
                      historyIndex <= 0
                        ? 'text-[#aeaeb6] cursor-not-allowed'
                        : 'text-[#363545] hover:bg-[#f3f3f7]'
                    }`}
                    title="Undo"
                  >
                    <Undo2 className="w-5 h-5" strokeWidth={2} />
                  </button>
                  
                  {/* Redo Button */}
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= boundaryHistory.length - 1}
                    className={`p-2 rounded-[2px] transition-colors ${
                      historyIndex >= boundaryHistory.length - 1
                        ? 'text-[#aeaeb6] cursor-not-allowed'
                        : 'text-[#363545] hover:bg-[#f3f3f7]'
                    }`}
                    title="Redo"
                  >
                    <Redo2 className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              )}
              
              {/* Zoom Controls - Bottom Right (separate from editing toolbar) */}
              <div className="absolute bottom-6 right-6 z-20 flex flex-col bg-white border border-[#d0d0d7] rounded-[2px] shadow-lg">
                <button
                  onClick={() => handleZoom(1)}
                  disabled={viewState.zoom >= 20}
                  className={`w-9 h-9 box-border flex items-center justify-center rounded-t-[2px] transition-colors border-b border-[#d0d0d7] ${
                    viewState.zoom >= 20
                      ? 'text-[#aeaeb6] cursor-not-allowed bg-[#f9f9fb]'
                      : 'text-[#363545] hover:bg-[#f3f3f7]'
                  }`}
                  title="Zoom in"
                >
                  <Plus className="w-5 h-5" strokeWidth={2} />
                </button>
                <button
                  onClick={() => handleZoom(-1)}
                  disabled={viewState.zoom <= 2}
                  className={`w-9 h-9 box-border flex items-center justify-center rounded-b-[2px] transition-colors ${
                    viewState.zoom <= 2
                      ? 'text-[#aeaeb6] cursor-not-allowed bg-[#f9f9fb]'
                      : 'text-[#363545] hover:bg-[#f3f3f7]'
                  }`}
                  title="Zoom out"
                >
                  <Minus className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
              
              <MapTiles
                viewState={viewState}
                mapDimensions={mapDimensions}
                mapType={mapType}
              />
              
              {/* Boundary Polygon Visualization */}
              {drawnBoundaryPoints.length > 0 && !(isInputCoordinatesMode && !showCoordinateCard) && (
                <svg className="absolute inset-0 pointer-events-none z-10" width={mapDimensions.width} height={mapDimensions.height}>
                  {(() => {
                    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
                    const screenPoints = drawnBoundaryPoints.map(p => {
                      const point = project(p.lat, p.lng, viewState.zoom);
                      return {
                        x: point.x - (centerPoint.x - mapDimensions.width / 2),
                        y: point.y - (centerPoint.y - mapDimensions.height / 2)
                      };
                    });
                    
                    const pathD = screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + 
                      (drawnBoundaryPoints.length >= 3 && !isDrawingBoundary ? ' Z' : '');
                    
                    return (
                      <>
                        {/* Polygon fill and stroke - 70% transparency */}
                        <path
                          d={pathD}
                          fill="rgba(123, 160, 255, 0.7)"
                          stroke="#7BA0FF"
                          strokeWidth={2}
                          strokeLinejoin="round"
                        />
                        
                        {/* Rubber band line from last point to cursor */}
                        {isDrawingBoundary && cursorPosition && screenPoints.length > 0 && (
                          <line
                            x1={screenPoints[screenPoints.length - 1].x}
                            y1={screenPoints[screenPoints.length - 1].y}
                            x2={cursorPosition.x}
                            y2={cursorPosition.y}
                            stroke="#7BA0FF"
                            strokeWidth={2}
                            strokeDasharray="8,4"
                          />
                        )}
                        
                        {/* Vertices - always show when boundary points exist */}
                        {drawnBoundaryPoints.length > 0 && screenPoints.map((p, i) => {
                          // First point gets visual enhancement when it can be clicked to close the polygon
                          const isClosingPoint = i === 0 && isDrawingBoundary && drawnBoundaryPoints.length >= 3;
                          const isHoveringClosingPoint = isClosingPoint && isNearFirstPointHover;
                          const isFirstPointWhileDrawing = i === 0 && isDrawingBoundary;
                          
                          // Point is being dragged or hovered (when in edit mode and not drawing)
                          const isBeingDragged = isDraggingPoint && draggedPointIndex === i;
                          const isHovered = !isDrawingBoundary && isEditMode && hoveredPointIndex === i;
                          const isSelected = !isDrawingBoundary && (selectedPointIndex === i || selectedCoordinateIndex === i);
                          
                          // Determine fill color
                          const fillColor = isSelected ? "#005f9e" : isFirstPointWhileDrawing ? "#7BA0FF" : "white";
                          
                          // Determine stroke color - white for selected or first point while drawing
                          const strokeColor = (isSelected || isFirstPointWhileDrawing) ? "white" : "#7BA0FF";
                          
                          return (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={isHoveringClosingPoint || isBeingDragged || isHovered ? 8 : 6}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isHoveringClosingPoint || isBeingDragged || isHovered ? 3 : 2}
                              className={
                                !isDrawingBoundary
                                  ? `pointer-events-auto ${
                                      isDeleteMode ? 'cursor-pen-tool' :
                                      isEditMode && isAltKeyPressed ? 'cursor-pointer' : 
                                      isEditMode ? 'cursor-grab' : 
                                      'cursor-pointer'
                                    }`
                                  : ''
                              }
                              style={{ pointerEvents: isDrawingBoundary ? 'none' : 'auto' }}
                            />
                          );
                        })}
                        
                        {/* Transparent circle indicator when hovering over line segment */}
                        {isEditMode && !isDrawingBoundary && hoveredLinePosition && (
                          <circle
                            cx={hoveredLinePosition.position.x}
                            cy={hoveredLinePosition.position.y}
                            r={6}
                            fill="rgba(255, 255, 255, 0.5)"
                            stroke="#7BA0FF"
                            strokeWidth={2}
                            className="pointer-events-none"
                          />
                        )}
                      </>
                    );
                  })()}
                </svg>
              )}
              
              {/* Plus icon indicator when hovering over line (to add point) */}
              {isEditMode && !isDrawingBoundary && hoveredLinePosition && (
                <div 
                  className="absolute pointer-events-none z-20"
                  style={{ 
                    left: hoveredLinePosition.position.x + 10, 
                    top: hoveredLinePosition.position.y - 10,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-lg border border-[#7BA0FF]">
                    <Plus className="w-3 h-3 text-[#005f9e]" strokeWidth={3} />
                  </div>
                </div>
              )}
              
              {/* Minus icon indicator when hovering over point with Alt/Option OR when delete mode is active */}
              {((isEditMode && !isDrawingBoundary && hoveredPointIndex !== null && isAltKeyPressed) || 
                (isDeleteMode && hoveredPointIndex !== null)) && (() => {
                const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
                const point = drawnBoundaryPoints[hoveredPointIndex];
                const pointScreen = project(point.lat, point.lng, viewState.zoom);
                const screenX = pointScreen.x - (centerPoint.x - mapDimensions.width / 2);
                const screenY = pointScreen.y - (centerPoint.y - mapDimensions.height / 2);
                
                return (
                  <div 
                    className="absolute pointer-events-none z-20"
                    style={{ 
                      left: screenX + 10, 
                      top: screenY - 10,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-lg border border-[#7BA0FF]">
                      <Minus className="w-3 h-3 text-[#005f9e]" strokeWidth={3} />
                    </div>
                  </div>
                );
              })()}
              
              {/* Right-click menu for anchor point actions */}
              {anchorContextMenu && (
                <div
                  className="absolute z-30"
                  style={{ left: anchorContextMenu.x, top: anchorContextMenu.y }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBoundaryPoint(anchorContextMenu.pointIndex);
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    className="bg-white border border-[#d0d0d7] shadow-lg rounded-[2px] px-3 py-2 text-[13px] text-[#363545] hover:bg-[#f3f3f7] text-left whitespace-nowrap"
                  >
                    Delete anchor point
                  </button>
                </div>
              )}

              {/* Location Marker */}
              {selectedLocationMarker && !(isInputCoordinatesMode && !showCoordinateCard) && (() => {
                const markerPoint = project(selectedLocationMarker.lat, selectedLocationMarker.lng, viewState.zoom);
                const screenX = markerPoint.x - project(viewState.lat, viewState.lng, viewState.zoom).x + (mapDimensions.width / 2);
                const screenY = markerPoint.y - project(viewState.lat, viewState.lng, viewState.zoom).y + (mapDimensions.height / 2);
                
                return (
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none z-20"
                    style={{ left: screenX, top: screenY }}
                  >
                    <MapPin className="w-12 h-12 text-[#005f9e] drop-shadow-lg" fill="white" stroke="#005f9e" strokeWidth={2} />
                  </div>
                );
              })()}

              {/* Layers/Terrain Button - Bottom Left */}
              <div className="absolute bottom-6 left-6 z-20" ref={mapTypeRef}>
                <div className="relative">
                  <button
                    onClick={() => setMapTypeDropdownOpen(!mapTypeDropdownOpen)}
                    className={`bg-white border border-[#d0d0d7] p-2 rounded-[2px] shadow-sm hover:bg-[#f3f3f7] ${mapTypeDropdownOpen ? 'bg-[#f3f3f7]' : ''}`}
                    title="Change map layer"
                  >
                    <Layers className="w-5 h-5 text-[#363545]" />
                  </button>
                  {mapTypeDropdownOpen && (
                    <div className="absolute left-0 bottom-full mb-1 bg-white border border-[#d0d0d7] shadow-lg rounded-[2px] z-20 flex flex-col min-w-[120px]">
                      <button
                        onClick={() => { setMapType('m'); setMapTypeDropdownOpen(false); }}
                        className={`text-left px-4 py-2 text-[13px] ${mapType === 'm' ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`}
                      >
                        Road Map
                      </button>
                      <button
                        onClick={() => { setMapType('s'); setMapTypeDropdownOpen(false); }}
                        className={`text-left px-4 py-2 text-[13px] ${mapType === 's' ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`}
                      >
                        Satellite
                      </button>
                      <button
                        onClick={() => { setMapType('y'); setMapTypeDropdownOpen(false); }}
                        className={`text-left px-4 py-2 text-[13px] ${mapType === 'y' ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`}
                      >
                        Hybrid
                      </button>
                      <button
                        onClick={() => { setMapType('p'); setMapTypeDropdownOpen(false); }}
                        className={`text-left px-4 py-2 text-[13px] ${mapType === 'p' ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`}
                      >
                        Terrain
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectLocationBoundaryDialog;
