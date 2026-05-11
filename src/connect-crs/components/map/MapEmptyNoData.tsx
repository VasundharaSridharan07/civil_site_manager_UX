import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Layers, Plus, Minus } from 'lucide-react';
import MapTiles from './MapTiles';
import { project } from '../../utils/geoUtils';

interface MapEmptyNoDataProps {
  viewState: { lat: number, lng: number, zoom: number };
  onClick?: () => void;
  disabled?: boolean;
  boundaryPoints?: { lat: number, lng: number }[];
  locationMarker?: { name: string; lat: number; lng: number } | null;
  mapType?: string;
  showCRSColumn?: boolean;
  onMapTypeChange?: (mapType: string) => void;
  onZoomChange?: (delta: number) => void;
  showControls?: boolean;
  onMapClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  isSelectionMode?: boolean;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
  isDragging?: boolean;
}

const MapEmptyNoData: React.FC<MapEmptyNoDataProps> = ({
  viewState,
  onClick,
  disabled = false,
  boundaryPoints = [],
  locationMarker = null,
  mapType = 'y',
  showCRSColumn = false,
  onMapTypeChange,
  onZoomChange,
  showControls = false,
  onMapClick,
  isSelectionMode = false,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  isDragging = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [mapTypeDropdownOpen, setMapTypeDropdownOpen] = useState(false);
  const mapTypeRef = useRef<HTMLDivElement>(null);

  // Resize Observer - needs to update when boundaryPoints change to recalculate
  useEffect(() => {
    if (!mapContainerRef.current) return;
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
  }, [boundaryPoints]); // Re-run when boundary points change

  // Enable wheel zoom when controls are shown
  useEffect(() => {
    if (!showControls) return; // Only enable zoom when controls are visible
    
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Determine zoom direction
      const zoomDelta = e.deltaY > 0 ? -1 : 1;
      onZoomChange?.(zoomDelta);
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [showControls, onZoomChange]);

  // Click outside for map type dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mapTypeRef.current && !mapTypeRef.current.contains(event.target as Node)) {
        setMapTypeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Convert boundary points to screen coordinates
  const getScreenPoints = () => {
    if (boundaryPoints.length === 0 || mapDimensions.width === 0) return [];
    
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    return boundaryPoints.map(p => {
      const point = project(p.lat, p.lng, viewState.zoom);
      return {
        x: point.x - (centerPoint.x - mapDimensions.width / 2),
        y: point.y - (centerPoint.y - mapDimensions.height / 2)
      };
    });
  };

  const screenPoints = getScreenPoints();
  
  // Calculate CRS column width based on boundary width
  const getCRSColumnWidth = () => {
    if (boundaryPoints.length === 0 || screenPoints.length === 0) return 80; // Default width
    
    // Get the min and max X coordinates of the boundary
    const xCoords = screenPoints.map(p => p.x);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const boundaryWidth = maxX - minX;
    
    // Make column width 120% of boundary width to ensure it covers the boundary
    return Math.max(boundaryWidth * 1.2, 80); // Minimum 80px
  };

  const crsColumnWidth = getCRSColumnWidth();
  
  // Get location marker screen position
  const locationMarkerPos = locationMarker && mapDimensions.width > 0 ? (() => {
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    const markerPoint = project(locationMarker.lat, locationMarker.lng, viewState.zoom);
    return {
      x: markerPoint.x - (centerPoint.x - mapDimensions.width / 2),
      y: markerPoint.y - (centerPoint.y - mapDimensions.height / 2)
    };
  })() : null;

  return (
    <div 
       ref={mapContainerRef}
       onClick={isSelectionMode ? onMapClick : (disabled ? undefined : onClick)}
       onMouseDown={onMouseDown}
       onMouseMove={onMouseMove}
       onMouseUp={onMouseUp}
       onMouseLeave={onMouseLeave}
       className={`relative w-full h-[240px] bg-[#e6e6e6] mb-4 border border-[#d0d0d7] rounded-[2px] overflow-hidden select-none ${disabled ? 'opacity-50 cursor-not-allowed' : isSelectionMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
       <MapTiles 
          viewState={viewState} 
          mapDimensions={mapDimensions} 
          mapType={mapType} 
       />
       
       {/* Selection mode banner - positioned below where search bar would be */}
       {isSelectionMode && (
         <div className="absolute top-[52px] left-1/2 -translate-x-1/2 bg-[#005f9e] text-white px-4 py-2 rounded-[2px] shadow-lg z-30 text-[13px] font-semibold">
           Click on the map to select location
         </div>
       )}
       
       {/* CRS Vertical Column Indicator - Show when CRS is defined and boundary exists */}
       {showCRSColumn && mapDimensions.width > 0 && mapDimensions.height > 0 && boundaryPoints.length > 0 && (
         <div className="absolute inset-0 pointer-events-none z-[10] flex items-center justify-center">
           <div 
             className="h-full"
             style={{
               width: `${crsColumnWidth}px`,
               background: 'rgba(245, 197, 24, 0.35)',
               borderLeft: '2px solid rgba(245, 197, 24, 0.8)',
               borderRight: '2px solid rgba(245, 197, 24, 0.8)',
             }}
           />
         </div>
       )}
       
       {/* Boundary Polygon */}
       {screenPoints.length > 0 && mapDimensions.width > 0 && (
         <svg className="absolute inset-0 pointer-events-none z-[15]" width={mapDimensions.width} height={mapDimensions.height}>
           {screenPoints.length >= 3 ? (
             /* Complete polygon with 3+ points */
             <path
               d={screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z'}
               fill="rgba(123, 160, 255, 0.7)"
               stroke="#7BA0FF"
               strokeWidth={2}
               strokeLinejoin="round"
             />
           ) : screenPoints.length === 2 ? (
             /* Line with 2 points */
             <line
               x1={screenPoints[0].x}
               y1={screenPoints[0].y}
               x2={screenPoints[1].x}
               y2={screenPoints[1].y}
               stroke="#7BA0FF"
               strokeWidth={2}
             />
           ) : null}
         </svg>
       )}
       
       {/* Location Marker */}
       {locationMarkerPos && (
         <div 
           className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none z-[16]"
           style={{ left: locationMarkerPos.x, top: locationMarkerPos.y }}
         >
           <MapPin className="w-8 h-8 text-[#005f9e] drop-shadow-lg" fill="white" stroke="#005f9e" strokeWidth={2} />
         </div>
       )}

       {/* Map Controls - Only show when showControls is true */}
       {showControls && (
         <>
           {/* Layers/Terrain Button - Bottom Left */}
           <div className="absolute bottom-3 left-3 z-20" ref={mapTypeRef}>
             <div className="relative">
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setMapTypeDropdownOpen(!mapTypeDropdownOpen);
                 }}
                 className={`bg-white border border-[#d0d0d7] p-2 rounded-[2px] shadow-sm hover:bg-[#f3f3f7] ${mapTypeDropdownOpen ? 'bg-[#f3f3f7]' : ''}`}
                 title="Change map layer"
               >
                 <Layers className="w-5 h-5 text-[#363545]" />
               </button>
               {mapTypeDropdownOpen && (
                 <div className="absolute left-0 bottom-full mb-1 bg-white border border-[#d0d0d7] shadow-lg rounded-[2px] z-20 flex flex-col min-w-[120px]">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onMapTypeChange?.('m');
                       setMapTypeDropdownOpen(false);
                     }}
                     className={`text-left px-4 py-2 text-[13px] ${mapType === 'm' ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`}
                   >
                     Road Map
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onMapTypeChange?.('s');
                       setMapTypeDropdownOpen(false);
                     }}
                     className={`text-left px-4 py-2 text-[13px] ${mapType === 's' ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`}
                   >
                     Satellite
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onMapTypeChange?.('y');
                       setMapTypeDropdownOpen(false);
                     }}
                     className={`text-left px-4 py-2 text-[13px] ${mapType === 'y' ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`}
                   >
                     Hybrid
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onMapTypeChange?.('p');
                       setMapTypeDropdownOpen(false);
                     }}
                     className={`text-left px-4 py-2 text-[13px] ${mapType === 'p' ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`}
                   >
                     Terrain
                   </button>
                 </div>
               )}
             </div>
           </div>

           {/* Zoom Controls - Bottom Right */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col bg-white border border-[#d0d0d7] rounded-[2px] shadow-lg">
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 onZoomChange?.(1);
               }}
              className="w-8 h-8 box-border flex items-center justify-center rounded-t-[2px] transition-colors border-b border-[#d0d0d7] hover:bg-[#f3f3f7] text-[#363545]"
               title="Zoom in"
             >
              <Plus className="w-5 h-5" strokeWidth={2} />
             </button>
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 onZoomChange?.(-1);
               }}
              className="w-8 h-8 box-border flex items-center justify-center rounded-b-[2px] transition-colors hover:bg-[#f3f3f7] text-[#363545]"
               title="Zoom out"
             >
              <Minus className="w-5 h-5" strokeWidth={2} />
             </button>
           </div>
         </>
       )}
    </div>
  );
};

export default MapEmptyNoData;
