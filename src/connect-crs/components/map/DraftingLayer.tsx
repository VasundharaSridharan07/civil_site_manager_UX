import React, { useState } from 'react';
import { project, unproject, distSq, getClosestPointOnSegment } from '../../utils/geoUtils';

interface DraftingLayerProps {
  viewState: { lat: number, lng: number, zoom: number };
  mapDimensions: { width: number, height: number };
  boundaryPoints: { lat: number, lng: number }[];
  setBoundaryPoints: React.Dispatch<React.SetStateAction<{ lat: number, lng: number }[]>>;
  isDrawing: boolean;
  showPreview: boolean;
  previewPoints: { lat: number, lng: number }[];
  searchMarker: { lat: number, lng: number } | null;
}

const DraftingLayer: React.FC<DraftingLayerProps> = ({
  viewState,
  mapDimensions,
  boundaryPoints,
  setBoundaryPoints,
  isDrawing,
  showPreview,
  previewPoints,
  searchMarker
}) => {
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ x: number, y: number, index: number } | null>(null);
  const [cursorScreenPos, setCursorScreenPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // To distinguish click vs drag

  // Styling Constants
  const EDIT_STROKE_COLOR = "#7BA0FF";
  const EDIT_FILL_COLOR = "rgba(123, 160, 255, 0.7)";
  const EDIT_DASH_ARRAY = "12, 8";
  const VIEW_STROKE_COLOR = "#005f9e";
  const VIEW_FILL_COLOR = "rgba(0, 95, 158, 0.2)";

  // Helpers
  const geoToScreen = (lat: number, lng: number) => {
    const point = project(lat, lng, viewState.zoom);
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    return {
      x: point.x - (centerPoint.x - mapDimensions.width / 2),
      y: point.y - (centerPoint.y - mapDimensions.height / 2)
    };
  };

  const screenToGeo = (screenX: number, screenY: number) => {
    const centerPoint = project(viewState.lat, viewState.lng, viewState.zoom);
    const worldX = centerPoint.x - (mapDimensions.width / 2) + screenX;
    const worldY = centerPoint.y - (mapDimensions.height / 2) + screenY;
    return unproject(worldX, worldY, viewState.zoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle interactions if drawing
    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setDragStart({ x: e.clientX, y: e.clientY });

    const screenPoints = boundaryPoints.map(p => geoToScreen(p.lat, p.lng));
    const HIT_TOLERANCE_SQ = 100;

    // Check Point Click
    const hitIndex = screenPoints.findIndex(p => distSq(p.x, p.y, mouseX, mouseY) < HIT_TOLERANCE_SQ);
    if (hitIndex !== -1) {
      setDraggingPointIndex(hitIndex);
      e.stopPropagation(); // Prevent map panning
      return;
    }

    // Check Edge Click
    if (hoveredEdge) {
      const newPointGeo = screenToGeo(hoveredEdge.x, hoveredEdge.y);
      const newPoints = [...boundaryPoints];
      newPoints.splice(hoveredEdge.index + 1, 0, newPointGeo);
      setBoundaryPoints(newPoints);
      setDraggingPointIndex(hoveredEdge.index + 1);
      setHoveredEdge(null);
      e.stopPropagation(); // Prevent map panning
      return;
    }
    
    // If clicking empty space, we do NOT stop propagation here. 
    // We let it bubble so the parent can handle panning.
    // However, we need to detect a "Click" (mouse up without move) to add a point.
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setCursorScreenPos({ x: mouseX, y: mouseY });

    if (isDrawing && draggingPointIndex !== null) {
      const newGeo = screenToGeo(mouseX, mouseY);
      setBoundaryPoints(prev => {
        const next = [...prev];
        next[draggingPointIndex] = newGeo;
        return next;
      });
      return;
    }

    // Edge Hover Detection
    if (isDrawing && boundaryPoints.length >= 2) {
      let bestEdge = null;
      let minDistSq = 100;
      const screenPoints = boundaryPoints.map(p => geoToScreen(p.lat, p.lng));
      const closed = boundaryPoints.length >= 3;
      const count = closed ? screenPoints.length : screenPoints.length - 1;

      for (let i = 0; i < count; i++) {
        const p1 = screenPoints[i];
        const p2 = screenPoints[(i + 1) % screenPoints.length];
        const proj = getClosestPointOnSegment({ x: mouseX, y: mouseY }, p1, p2);
        const dSq = distSq(mouseX, mouseY, proj.x, proj.y);
        const d1 = distSq(mouseX, mouseY, p1.x, p1.y);
        const d2 = distSq(mouseX, mouseY, p2.x, p2.y);

        if (dSq < minDistSq && d1 > 100 && d2 > 100) {
          minDistSq = dSq;
          bestEdge = { x: proj.x, y: proj.y, index: i };
        }
      }
      setHoveredEdge(bestEdge);
    } else {
      setHoveredEdge(null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggingPointIndex !== null) {
      setDraggingPointIndex(null);
      return;
    }

    // Handle "Add Point" on Click (if not dragged)
    if (isDrawing) {
      const dist = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
      if (dist < 5) {
        // It's a click
        const rect = e.currentTarget.getBoundingClientRect();
        // Check if we didn't click on an existing point (handled in MouseDown)
        // Add new point at cursor
        const newPoint = screenToGeo(e.clientX - rect.left, e.clientY - rect.top);
        setBoundaryPoints(prev => [...prev, newPoint]);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const screenPoints = boundaryPoints.map(p => geoToScreen(p.lat, p.lng));
    const hitIndex = screenPoints.findIndex(p => distSq(p.x, p.y, mouseX, mouseY) < 100);
    if (hitIndex !== -1) {
      const newPoints = [...boundaryPoints];
      newPoints.splice(hitIndex, 1);
      setBoundaryPoints(newPoints);
      setDraggingPointIndex(null);
    }
  };

  const pointsToShow = showPreview ? previewPoints : boundaryPoints;
  const isEditModeActive = isDrawing || showPreview;

  // Search marker position
  const searchMarkerPos = searchMarker ? geoToScreen(searchMarker.lat, searchMarker.lng) : null;

  return (
    <div 
      className="absolute inset-0 z-10"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      style={{ pointerEvents: isDrawing ? 'auto' : 'none' }}
    >
      <svg className="w-full h-full">
        {pointsToShow.length > 0 && (
          <>
            <path 
              d={`M ${pointsToShow.map(p => { const s = geoToScreen(p.lat, p.lng); return `${s.x},${s.y}`; }).join(' L ')} ${isEditModeActive ? '' : 'Z'}`} 
              fill={isEditModeActive ? EDIT_FILL_COLOR : VIEW_FILL_COLOR} 
              stroke={isEditModeActive ? EDIT_STROKE_COLOR : VIEW_STROKE_COLOR} 
              strokeWidth={2} 
              strokeDasharray={isEditModeActive ? EDIT_DASH_ARRAY : "none"} 
              fillRule="evenodd" 
            />
            
            {/* Vertices */}
            {isEditModeActive && pointsToShow.map((p, i) => { 
               const s = geoToScreen(p.lat, p.lng); 
               return ( 
                 <circle 
                   key={i} 
                   cx={s.x} 
                   cy={s.y} 
                   r={5} 
                   fill="white" 
                   stroke={EDIT_STROKE_COLOR} 
                   strokeWidth={2} 
                   className="pointer-events-auto cursor-grab active:cursor-grabbing"
                 /> 
               ); 
            })}

            {/* Hovered Edge Indicator */}
            {isEditModeActive && hoveredEdge && ( 
              <circle cx={hoveredEdge.x} cy={hoveredEdge.y} r={4} fill={EDIT_STROKE_COLOR} opacity={0.6} className="pointer-events-none" /> 
            )}
            
            {/* Rubber Band Line */}
            {isDrawing && draggingPointIndex === null && pointsToShow.length > 0 && (
              <line 
                x1={geoToScreen(pointsToShow[pointsToShow.length - 1].lat, pointsToShow[pointsToShow.length - 1].lng).x} 
                y1={geoToScreen(pointsToShow[pointsToShow.length - 1].lat, pointsToShow[pointsToShow.length - 1].lng).y} 
                x2={cursorScreenPos.x} 
                y2={cursorScreenPos.y} 
                stroke={EDIT_STROKE_COLOR} 
                strokeWidth={2} 
                strokeDasharray={EDIT_DASH_ARRAY} 
                className="pointer-events-none"
              />
            )}
          </>
        )}
      </svg>

      {/* Search Marker Overlay */}
      {searchMarkerPos && (
         <div className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none" style={{ left: searchMarkerPos.x, top: searchMarkerPos.y }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z M12 6.5C10.62 6.5 9.5 7.62 9.5 9C9.5 10.38 10.62 11.5 12 11.5C13.38 11.5 14.5 10.38 14.5 9C14.5 7.62 13.38 6.5 12 6.5Z" fill="#fbad26" stroke="#005f9e" strokeWidth="2" /></svg>
         </div>
       )}
    </div>
  );
};

export default DraftingLayer;