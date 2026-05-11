// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Globe, Info } from 'lucide-react';
import MapTiles from '../map/MapTiles';
import { project, unproject, formatLatForDisplay, formatLongForDisplay } from '../../utils/geoUtils';
import type { CRSItem } from '../../types';

const PADDING_PX = 24;
const MIN_ZOOM = 2;
const MAX_ZOOM = 20;

/** Compute center and zoom so the boundary fits in the given map dimensions. */
function fitViewToBoundary(
  boundaryPoints: { lat: number; lng: number }[],
  mapWidth: number,
  mapHeight: number
): { lat: number; lng: number; zoom: number } {
  if (boundaryPoints.length < 2 || mapWidth <= 0 || mapHeight <= 0) {
    return { lat: 50, lng: 10, zoom: 4 };
  }
  const lats = boundaryPoints.map(p => p.lat);
  const lngs = boundaryPoints.map(p => p.lng);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const w = mapWidth - 2 * PADDING_PX;
  const h = mapHeight - 2 * PADDING_PX;
  if (w <= 0 || h <= 0) return { lat: centerLat, lng: centerLng, zoom: 10 };

  for (let zoom = MAX_ZOOM; zoom >= MIN_ZOOM; zoom--) {
    const centerPoint = project(centerLat, centerLng, zoom);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of boundaryPoints) {
      const pt = project(p.lat, p.lng, zoom);
      const sx = pt.x - centerPoint.x + mapWidth / 2;
      const sy = pt.y - centerPoint.y + mapHeight / 2;
      minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
    }
    const boxW = maxX - minX;
    const boxH = maxY - minY;
    if (boxW <= w && boxH <= h) {
      return { lat: centerLat, lng: centerLng, zoom };
    }
  }
  return { lat: centerLat, lng: centerLng, zoom: MIN_ZOOM };
}

// Tooltip component for info icons
const InfoTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };
    
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show]);
  
  useEffect(() => {
    if (show && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8
      });
    }
  }, [show]);
  
  return (
    <>
      <div className="relative inline-flex" ref={buttonRef}>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setShow(!show);
          }}
          className="cursor-pointer"
        >
          {children}
        </div>
      </div>
      {show && createPortal(
        <div 
          ref={tooltipRef}
          className="fixed w-72 p-3 bg-[#363545] text-white text-[12px] rounded-[4px] shadow-xl z-[9999] leading-relaxed"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(-50%)'
          }}
        >
          {text}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#363545]"></div>
        </div>,
        document.body
      )}
    </>
  );
};

interface CRSPreviewPanelProps {
  selectedCRS: CRSItem | null;
  horizontalCRS?: {
    code: string;
    name: string;
    unit?: string;
  } | null;
  verticalCRS?: {
    code: string;
    name: string;
    unit?: string;
  } | null;
  boundaryPoints: { lat: number; lng: number }[];
  locationMarker?: { name: string; lat: number; lng: number } | null;
  viewState: { lat: number; lng: number; zoom: number };
  mapType?: string;
  onEditCRS?: () => void;
  showEditButton?: boolean;
  // Additional fields for Main Edit screen
  selectedUnit?: string;
  onUnitChange?: (unit: string) => void;
  showUnitSelector?: boolean;
  localSiteSettings?: {
    latitude?: string;
    longitude?: string;
    height?: string;
    scaleFactor?: string;
    northingOffset?: string;
    eastingOffset?: string;
  } | null;
  calibrationSettings?: {
    horizontal?: string;
    vertical?: string;
  } | null;
  onEditLocalSite?: () => void;
  onEditCalibration?: () => void;
  showLocalSiteSection?: boolean;
  onEditHorizontal?: () => void;
  onEditVertical?: () => void;
  showIndividualCRSEdit?: boolean;
  // Title section
  showTitle?: boolean;
  title?: string;
  // Footer buttons
  showFooterButtons?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  canProceed?: boolean;
  /** When true, the map can be panned and zoomed (e.g. in file import Review step). */
  allowMapInteraction?: boolean;
}

const UNIT_OPTIONS = [
  { value: 'ft', label: 'International Foot' },
  { value: 'ftUS', label: 'US Survey Foot' },
  { value: 'm', label: 'Meters' },
  { value: 'Angular', label: 'Angular' }
];

const CRSPreviewPanel: React.FC<CRSPreviewPanelProps> = ({
  selectedCRS,
  horizontalCRS,
  verticalCRS,
  boundaryPoints,
  locationMarker,
  viewState,
  mapType = 's',
  onEditCRS,
  showEditButton = true,
  selectedUnit,
  onUnitChange,
  showUnitSelector = false,
  localSiteSettings,
  calibrationSettings,
  onEditLocalSite,
  onEditCalibration,
  showLocalSiteSection = false,
  onEditHorizontal,
  onEditVertical,
  showIndividualCRSEdit = false,
  showTitle = false,
  title = '',
  showFooterButtons = false,
  onBack,
  onNext,
  nextLabel = 'Next',
  canProceed = true,
  allowMapInteraction = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  // Local view state for pan/zoom when allowMapInteraction is true
  const [localViewState, setLocalViewState] = useState(viewState);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartCenter, setDragStartCenter] = useState({ lat: 0, lng: 0 });

  // When interactive and we have a boundary + dimensions: fit view so blue boundary is fully visible. Otherwise sync from parent.
  useEffect(() => {
    if (allowMapInteraction && boundaryPoints.length >= 2 && mapDimensions.width > 0 && mapDimensions.height > 0) {
      setLocalViewState(fitViewToBoundary(boundaryPoints, mapDimensions.width, mapDimensions.height));
    } else {
      setLocalViewState(viewState);
    }
  }, [viewState.lat, viewState.lng, viewState.zoom, allowMapInteraction, boundaryPoints, mapDimensions.width, mapDimensions.height]);

  const effectiveViewState = allowMapInteraction ? localViewState : viewState;

  // Derive horizontal/vertical from selectedCRS if not explicitly provided
  const displayHorizontal = horizontalCRS || (selectedCRS ? {
    code: selectedCRS.horizontalCode || selectedCRS.code,
    name: selectedCRS.horizontalComponent || selectedCRS.name.split('+')[0]?.trim() || selectedCRS.name,
    unit: selectedCRS.unit
  } : null);

  const displayVertical = verticalCRS || (selectedCRS ? {
    code: selectedCRS.verticalCode || '',
    name: selectedCRS.verticalComponent || selectedCRS.name.split('+')[1]?.trim() || selectedCRS.verticalDatum || '',
    unit: selectedCRS.unit
  } : null);

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
  }, [boundaryPoints]);

  // When map is not interactive: disable wheel. When interactive: handle wheel for zoom (non-passive so we can preventDefault).
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (!allowMapInteraction) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      setLocalViewState(prev => ({
        ...prev,
        zoom: Math.min(Math.max(prev.zoom + delta, 2), 20)
      }));
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [allowMapInteraction]);

  // Convert boundary points to screen coordinates
  const getScreenPoints = () => {
    if (boundaryPoints.length === 0 || mapDimensions.width === 0) return [];
    
    const centerPoint = project(effectiveViewState.lat, effectiveViewState.lng, effectiveViewState.zoom);
    return boundaryPoints.map(p => {
      const point = project(p.lat, p.lng, effectiveViewState.zoom);
      return {
        x: point.x - (centerPoint.x - mapDimensions.width / 2),
        y: point.y - (centerPoint.y - mapDimensions.height / 2)
      };
    });
  };

  // Pan/zoom handlers when allowMapInteraction is true
  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowMapInteraction) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartCenter({ lat: localViewState.lat, lng: localViewState.lng });
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowMapInteraction || !isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const centerPoint = project(dragStartCenter.lat, dragStartCenter.lng, localViewState.zoom);
    const newCenterWorld = { x: centerPoint.x - dx, y: centerPoint.y - dy };
    const newCenterGeo = unproject(newCenterWorld.x, newCenterWorld.y, localViewState.zoom);
    setLocalViewState(prev => ({ ...prev, lat: newCenterGeo.lat, lng: newCenterGeo.lng }));
  };

  const handleMapMouseUp = () => {
    if (isDragging) setIsDragging(false);
  };

  const handleMapMouseLeave = () => {
    if (isDragging) setIsDragging(false);
  };


  const screenPoints = getScreenPoints();

  return (
    <div className="flex h-full">
      {/* Left Panel - CRS Summary */}
      <div className="w-[400px] flex-shrink-0 bg-white border-r border-[#d0d0d7] flex flex-col">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title Section */}
          {showTitle && title && (
            <div className="px-6 py-6 border-b border-[#d0d0d7]">
              <h3 className="text-[16px] font-bold text-[#363545] m-0">{title}</h3>
            </div>
          )}
          
          {/* CRS Coordinates Section */}
          <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-[#363545]">CRS coordinates</h3>
            {showEditButton && onEditCRS && (
              <button
                onClick={onEditCRS}
                className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                title="Edit CRS"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Horizontal CRS */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f5c518] mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[13px] font-semibold text-[#363545]">Horizontal CRS</div>
                {showIndividualCRSEdit && onEditHorizontal && (
                  <button
                    onClick={onEditHorizontal}
                    className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                    title="Edit Horizontal CRS"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {displayHorizontal ? (
                <div className="text-[13px] text-[#6a6976] leading-relaxed">
                  <div className="font-medium">{displayHorizontal.name}</div>
                  {displayHorizontal.unit && (
                    <div className="text-[12px] text-[#aeaeb6] mt-1">Unit: {displayHorizontal.unit}</div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-[#aeaeb6] italic">No horizontal has been added</div>
              )}
            </div>
          </div>

          {/* Vertical CRS */}
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e88c30] mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[13px] font-semibold text-[#363545]">Vertical CRS</div>
                {showIndividualCRSEdit && onEditVertical && (
                  <button
                    onClick={onEditVertical}
                    className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                    title="Edit Vertical CRS"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {displayVertical && displayVertical.name ? (
                <div className="text-[13px] text-[#6a6976] leading-relaxed">
                  <div className="font-medium">{displayVertical.name}</div>
                  {displayVertical.unit && (
                    <div className="text-[12px] text-[#aeaeb6] mt-1">Unit: {displayVertical.unit}</div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-[#aeaeb6] italic">No vertical has been added</div>
              )}
            </div>
          </div>
          </div>

          {/* Unit Selector */}
          {showUnitSelector && (
            <div className="px-6 py-5 border-t border-[#eaeaef]">
            <label className="block text-[13px] font-bold text-[#363545] mb-2">CRS unit</label>
            <div className="relative w-full max-w-[200px]">
              <select
                value={selectedUnit || 'm'}
                onChange={(e) => onUnitChange?.(e.target.value)}
                className="w-full appearance-none bg-white border border-[#d0d0d7] rounded-[2px] px-3 py-2 pr-9 text-[14px] text-[#363545] focus:outline-none focus:border-[#005f9e]"
              >
                {UNIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-[#6a6976]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            </div>
          )}

          {/* Local Site Settings */}
          {showLocalSiteSection && (
            <div className="px-6 py-5 border-t border-[#eaeaef]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#363545]">Local site settings</span>
                <InfoTooltip text="Adjusts scale factors and offsets to match grid coordinates with ground measurements at your project location.">
                  <button className="text-[#6a6976] hover:text-[#005f9e] transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </InfoTooltip>
              </div>
              {onEditLocalSite && (
                <button
                  onClick={onEditLocalSite}
                  className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                  title="Edit Local Site Settings"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {localSiteSettings ? (
              <div className="text-[13px] text-[#6a6976] space-y-2">
                {localSiteSettings.latitude && (
                  <div><span className="uppercase text-[11px] text-[#aeaeb6] font-semibold">LATITUDE</span><br/>{formatLatForDisplay(localSiteSettings.latitude)}</div>
                )}
                {localSiteSettings.longitude && (
                  <div><span className="uppercase text-[11px] text-[#aeaeb6] font-semibold">LONGITUDE</span><br/>{formatLongForDisplay(localSiteSettings.longitude)}</div>
                )}
                {localSiteSettings.height && (
                  <div><span className="uppercase text-[11px] text-[#aeaeb6] font-semibold">HEIGHT</span><br/>{localSiteSettings.height}</div>
                )}
                {localSiteSettings.scaleFactor && (
                  <div><span className="uppercase text-[11px] text-[#aeaeb6] font-semibold">SCALE FACTOR</span><br/>{localSiteSettings.scaleFactor}</div>
                )}
              </div>
            ) : (
                <div className="text-[13px] text-[#aeaeb6] italic">Not configured</div>
              )}
            </div>
          )}

          {/* Site Calibration */}
          {showLocalSiteSection && (
            <div className="px-6 py-5 border-t border-[#eaeaef]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#363545]">Site calibration</span>
                <InfoTooltip text="Applies transformation adjustments to align coordinates with known control points at your site.">
                  <button className="text-[#6a6976] hover:text-[#005f9e] transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </InfoTooltip>
              </div>
              {onEditCalibration && (
                <button
                  onClick={onEditCalibration}
                  className="text-[#6a6976] hover:text-[#005f9e] transition-colors"
                  title="Edit Site Calibration"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                )}
              </div>
              {calibrationSettings ? (
                <div className="text-[13px] text-[#6a6976] space-y-2">
                  {calibrationSettings.horizontal && (
                    <div><span className="uppercase text-[11px] text-[#aeaeb6] font-semibold">HORIZONTAL</span><br/>{calibrationSettings.horizontal}</div>
                  )}
                  {calibrationSettings.vertical && (
                    <div><span className="uppercase text-[11px] text-[#aeaeb6] font-semibold">VERTICAL</span><br/>{calibrationSettings.vertical}</div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-[#aeaeb6] italic">Not configured</div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {showFooterButtons && (
          <div className="border-t border-[#d0d0d7] px-6 py-4 bg-[#f9f9fb] flex justify-end items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            {onNext && (
              <button 
                onClick={onNext}
                disabled={!canProceed}
                className={`flex items-center gap-2 text-white text-[14px] font-bold py-2 px-6 rounded-[2px] transition-colors ${
                  canProceed
                    ? 'bg-[#005f9e] hover:bg-[#00437b]' 
                    : 'bg-[#aeb0b6] cursor-not-allowed'
                }`}
              >
                {nextLabel}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Map */}
      <div 
        ref={mapContainerRef}
        className={`flex-1 relative bg-[#e6e6e6] overflow-hidden ${allowMapInteraction ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseLeave}
      >
        <MapTiles 
          viewState={effectiveViewState} 
          mapDimensions={mapDimensions} 
          mapType={mapType} 
        />
        
        {/* Boundary Polygon */}
        {screenPoints.length > 0 && mapDimensions.width > 0 && (
          <svg className="absolute inset-0 pointer-events-none z-[15]" width={mapDimensions.width} height={mapDimensions.height}>
            
            {screenPoints.length >= 3 ? (
              <path
                d={screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z'}
                fill="rgba(123, 160, 255, 0.7)"
                stroke="#7BA0FF"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            ) : screenPoints.length === 2 ? (
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

        {/* No boundary message */}
        {boundaryPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-[20]">
            <div className="bg-white/90 px-4 py-2 rounded text-[13px] text-[#6a6976]">
              No boundary defined
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRSPreviewPanel;
