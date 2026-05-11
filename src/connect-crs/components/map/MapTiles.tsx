import React, { useMemo, useState, useEffect, useRef } from 'react';
import { project, TILE_SIZE } from '../../utils/geoUtils';

interface MapTilesProps {
  viewState: { lat: number, lng: number, zoom: number };
  mapDimensions: { width: number, height: number };
  mapType: string;
}

const MapTiles: React.FC<MapTilesProps> = React.memo(({ viewState, mapDimensions, mapType }) => {
  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set());
  const [previousZoomTiles, setPreviousZoomTiles] = useState<Array<{
    key: string;
    url: string;
    left: number;
    top: number;
    zoom: number;
    viewportLeft: number;
    viewportTop: number;
  }>>([]);
  const previousZoomRef = useRef<number>(viewState.zoom);
  const previousTilesRef = useRef<Array<{
    key: string;
    url: string;
    left: number;
    top: number;
    zoom: number;
    viewportLeft: number;
    viewportTop: number;
  }>>([]);

  const tiles = useMemo(() => {
    if (mapDimensions.width === 0) return [];
    const { lat, lng, zoom } = viewState;
    const centerPoint = project(lat, lng, zoom);
    const viewportLeft = centerPoint.x - mapDimensions.width / 2;
    const viewportTop = centerPoint.y - mapDimensions.height / 2;
    const maxTiles = Math.pow(2, zoom);
    
    const minTileX = Math.floor(viewportLeft / TILE_SIZE);
    const maxTileX = Math.floor((viewportLeft + mapDimensions.width) / TILE_SIZE);
    const minTileY = Math.floor(viewportTop / TILE_SIZE);
    const maxTileY = Math.floor((viewportTop + mapDimensions.height) / TILE_SIZE);
    
    const generatedTiles = [];
    
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
         if (y < 0 || y >= maxTiles) continue;
         const normalizedX = ((x % maxTiles) + maxTiles) % maxTiles;
         const url = `https://mt1.google.com/vt/lyrs=${mapType}&x=${normalizedX}&y=${y}&z=${zoom}`;
         generatedTiles.push({
           key: `${zoom}-${x}-${y}`,
           url,
           left: x * TILE_SIZE - viewportLeft,
           top: y * TILE_SIZE - viewportTop,
           zoom,
           viewportLeft,
           viewportTop
         });
      }
    }
    return generatedTiles;
  }, [viewState, mapDimensions, mapType]);

  // Store tiles when zoom hasn't changed (for use when zoom DOES change)
  useEffect(() => {
    if (previousZoomRef.current === viewState.zoom) {
      // Zoom hasn't changed - store current tiles for future use
      previousTilesRef.current = tiles.map(t => ({
        key: t.key,
        url: t.url,
        left: t.left,
        top: t.top,
        zoom: t.zoom,
        viewportLeft: t.viewportLeft,
        viewportTop: t.viewportTop
      }));
    }
  }, [tiles, viewState.zoom]);

  // Track zoom changes and keep previous tiles visible
  useEffect(() => {
    const zoomChanged = previousZoomRef.current !== viewState.zoom;
    
    if (zoomChanged && previousTilesRef.current.length > 0) {
      // Zoom changed - keep previous tiles visible (these are the tiles from BEFORE the zoom)
      setPreviousZoomTiles([...previousTilesRef.current]);
      // Clear loaded tiles for new zoom level
      setLoadedTiles(new Set());
    }
    
    // Update zoom ref
    previousZoomRef.current = viewState.zoom;
  }, [viewState.zoom]);

  // Calculate previous zoom tiles position at current zoom
  const previousTilesScaled = useMemo(() => {
    if (previousZoomTiles.length === 0) return [];
    
    const prevZoom = previousZoomTiles[0]?.zoom;
    if (!prevZoom || prevZoom === viewState.zoom) return [];
    
    const zoomDiff = viewState.zoom - prevZoom;
    const scale = Math.pow(2, zoomDiff);
    const { lat, lng } = viewState;
    const centerPoint = project(lat, lng, viewState.zoom);
    const viewportLeft = centerPoint.x - mapDimensions.width / 2;
    const viewportTop = centerPoint.y - mapDimensions.height / 2;
    
    return previousZoomTiles.map(tile => {
      // Calculate tile world coordinates at previous zoom
      const prevTileX = Math.floor((tile.left + tile.viewportLeft) / TILE_SIZE);
      const prevTileY = Math.floor((tile.top + tile.viewportTop) / TILE_SIZE);
      
      // Scale to current zoom
      const newTileX = prevTileX * scale;
      const newTileY = prevTileY * scale;
      const newLeft = newTileX * TILE_SIZE - viewportLeft;
      const newTop = newTileY * TILE_SIZE - viewportTop;
      
      return {
        ...tile,
        left: newLeft,
        top: newTop,
        scale
      };
    });
  }, [previousZoomTiles, viewState, mapDimensions]);

  const handleTileLoad = (tileKey: string) => {
    setLoadedTiles(prev => {
      const newSet = new Set(prev).add(tileKey);
      // Once all current tiles are loaded, clear previous zoom tiles
      const currentTileKeys = tiles.map(t => t.key);
      const allLoaded = currentTileKeys.every(key => newSet.has(key));
      if (allLoaded && currentTileKeys.length > 0) {
        setTimeout(() => setPreviousZoomTiles([]), 150);
      }
      return newSet;
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none bg-[#e6e6e6]">
       {/* Render previous zoom tiles (scaled up) while loading */}
       {previousTilesScaled.map(tile => (
          <img 
            key={`prev-${tile.key}`}
            src={tile.url} 
            className="absolute max-w-none transition-opacity duration-200"
            style={{ 
              left: tile.left, 
              top: tile.top, 
              width: TILE_SIZE * (tile.scale || 1), 
              height: TILE_SIZE * (tile.scale || 1),
              opacity: 0.7,
              imageRendering: 'pixelated'
            }} 
            alt="" 
          />
       ))}
       {/* Render current zoom tiles */}
       {tiles.map(tile => {
         const isLoaded = loadedTiles.has(tile.key);
         return (
           <img 
             key={tile.key} 
             src={tile.url} 
             className="absolute max-w-none transition-opacity duration-200"
             style={{ 
               left: tile.left, 
               top: tile.top, 
               width: TILE_SIZE, 
               height: TILE_SIZE,
               opacity: isLoaded ? 1 : 0
             }} 
             alt=""
             onLoad={() => handleTileLoad(tile.key)}
             onError={() => handleTileLoad(tile.key)} // Mark as "loaded" even on error to prevent hanging
           />
         );
       })}
    </div>
  );
});

export default MapTiles;