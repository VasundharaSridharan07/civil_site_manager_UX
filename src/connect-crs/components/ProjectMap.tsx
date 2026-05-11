import React, { useState, useRef, useEffect } from 'react';
import { project, unproject } from '../utils/geoUtils';
import MapTiles from './map/MapTiles';
import MapControls from './map/MapControls';
import DraftingLayer from './map/DraftingLayer';
import DraftingToolbar from './map/DraftingToolbar';

interface ProjectMapProps {
  viewState: { lat: number, lng: number, zoom: number };
  setViewState: React.Dispatch<React.SetStateAction<{ lat: number, lng: number, zoom: number }>>;
  isDrawing: boolean;
  boundaryPoints: { lat: number, lng: number }[];
  setBoundaryPoints: React.Dispatch<React.SetStateAction<{ lat: number, lng: number }[]>>;
  previewPoints: { lat: number, lng: number }[];
  showPreview: boolean;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  searchMarker: { lat: number, lng: number } | null;
  setSearchMarker: (marker: { lat: number, lng: number } | null) => void;
}

const ProjectMap: React.FC<ProjectMapProps> = ({
  viewState,
  setViewState,
  isDrawing,
  boundaryPoints,
  setBoundaryPoints,
  previewPoints,
  showPreview,
  onFinishDrawing,
  onCancelDrawing,
  searchMarker,
  setSearchMarker
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [mapType, setMapType] = useState('y');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartCenter, setDragStartCenter] = useState({ lat: 0, lng: 0 });

  // Resize Observer
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
  }, []);

  // Wheel Zoom Logic
  const zoomAccumulator = useRef(0);
  useEffect(() => {
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
  }, [setViewState]);

  // Main Panning Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore clicks on controls
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select')) return;
    
    // NOTE: Drafting interactions are handled by DraftingLayer using stopPropagation.
    // If we reach here, it means we clicked on the background or a non-interactive area, so we Pan.
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartCenter({ lat: viewState.lat, lng: viewState.lng });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const centerPoint = project(dragStartCenter.lat, dragStartCenter.lng, viewState.zoom);
      const newCenterWorld = { x: centerPoint.x - dx, y: centerPoint.y - dy };
      const newCenterGeo = unproject(newCenterWorld.x, newCenterWorld.y, viewState.zoom);
      setViewState(prev => ({ ...prev, lat: newCenterGeo.lat, lng: newCenterGeo.lng }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Zoom Helper
  const handleZoom = (delta: number) => {
    setViewState(prev => ({ ...prev, zoom: Math.min(Math.max(prev.zoom + delta, 2), 20) }));
  };

  // Helper to calculate best fit zoom based on bounding box
  const calculateZoomFromBounds = (
    minLat: number, 
    maxLat: number, 
    minLng: number, 
    maxLng: number, 
    width: number, 
    height: number
  ) => {
    // Iterate zooms from 18 down to 2 to find the highest zoom that fits
    for (let z = 18; z >= 2; z--) {
      const sw = project(minLat, minLng, z);
      const ne = project(maxLat, maxLng, z);
      
      // Calculate dimensions in pixels at this zoom
      const boundsWidth = Math.abs(ne.x - sw.x);
      const boundsHeight = Math.abs(sw.y - ne.y); // y increases south, so minLat gives larger y
      
      // Fit with 10% padding
      if (boundsWidth <= width * 0.9 && boundsHeight <= height * 0.9) {
        return z;
      }
    }
    return 2; // Default fallback
  };

  // Search Helper
  const handleSearchSelect = (lat: number, lng: number, boundingBox?: [number, number, number, number]) => {
    let newZoom = 14;

    if (boundingBox && mapDimensions.width > 0 && mapDimensions.height > 0) {
      // boundingBox is [minlat, maxlat, minlon, maxlon]
      const [minLat, maxLat, minLon, maxLon] = boundingBox;
      newZoom = calculateZoomFromBounds(minLat, maxLat, minLon, maxLon, mapDimensions.width, mapDimensions.height);
    }

    setViewState(prev => ({ ...prev, lat, lng, zoom: newZoom }));
    setSearchMarker({ lat, lng });
  };

  return (
    <div 
       ref={mapContainerRef}
       className={`relative w-full h-[350px] bg-[#e6e6e6] mb-4 border border-[#d0d0d7] rounded-[2px] overflow-hidden select-none group ${isDrawing ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
       onMouseDown={handleMouseDown}
       onMouseMove={handleMouseMove}
       onMouseUp={handleMouseUp}
       onMouseLeave={handleMouseUp}
    >
       <MapTiles 
          viewState={viewState} 
          mapDimensions={mapDimensions} 
          mapType={mapType} 
       />
       
       <DraftingLayer 
          viewState={viewState}
          mapDimensions={mapDimensions}
          boundaryPoints={boundaryPoints}
          setBoundaryPoints={setBoundaryPoints}
          isDrawing={isDrawing}
          showPreview={showPreview}
          previewPoints={previewPoints}
          searchMarker={searchMarker}
       />

       <MapControls 
          mapType={mapType}
          setMapType={setMapType}
          onZoom={handleZoom}
          onSearch={handleSearchSelect}
       />

       {isDrawing && (
         <DraftingToolbar onCancel={onCancelDrawing} onDone={onFinishDrawing} />
       )}
    </div>
  );
};

export default ProjectMap;