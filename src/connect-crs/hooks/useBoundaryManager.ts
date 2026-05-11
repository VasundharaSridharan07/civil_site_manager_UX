import React, { useState, useEffect } from 'react';
import { mockGeoToProj, mockProjToGeo } from '../utils/geoUtils';

interface UseBoundaryManagerProps {
  setViewState: React.Dispatch<React.SetStateAction<{ lat: number; lng: number; zoom: number }>>;
  hasProjectedCRS: boolean;
}

export const useBoundaryManager = ({ setViewState, hasProjectedCRS }: UseBoundaryManagerProps) => {
  // Boundary State
  const [boundaryPoints, setBoundaryPoints] = useState<{lat: number, lng: number}[]>([]);
  const [originalBoundaryPoints, setOriginalBoundaryPoints] = useState<{lat: number, lng: number}[]>([]);
  const [previewBoundaryPoints, setPreviewBoundaryPoints] = useState<{lat: number, lng: number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundaryText, setBoundaryText] = useState("No project boundary defined.");
  const [coordinateFormat, setCoordinateFormat] = useState<'geo' | 'proj'>('geo');
  const [boundaryInputValue, setBoundaryInputValue] = useState("");

  // Dialog Visibility
  const [showBoundaryDialog, setShowBoundaryDialog] = useState(false);
  const [showBoundaryFileSelectDialog, setShowBoundaryFileSelectDialog] = useState(false);

  // Update Preview Points when boundary input dialog changes
  useEffect(() => {
    if (!showBoundaryDialog) {
        setPreviewBoundaryPoints([]);
        return;
    }
    const lines = boundaryInputValue.split('\n');
    const points: {lat: number, lng: number}[] = [];
    
    for (const line of lines) {
        const parts = line.trim().split(/[,\s]+/);
        if (parts.length >= 2) {
            const v1 = parseFloat(parts[0]);
            const v2 = parseFloat(parts[1]);
            if (!isNaN(v1) && !isNaN(v2)) {
                if (coordinateFormat === 'proj' && hasProjectedCRS) {
                    points.push(mockProjToGeo(v1, v2));
                } else {
                    points.push({ lat: v1, lng: v2 });
                }
            }
        }
    }
    setPreviewBoundaryPoints(points);
  }, [boundaryInputValue, showBoundaryDialog, coordinateFormat, hasProjectedCRS]);

  // Drawing Actions
  const startDrawing = () => {
    setOriginalBoundaryPoints([...boundaryPoints]);
    setIsDrawing(true);
    if (boundaryPoints.length === 0) setBoundaryPoints([]);
    else setViewState(prev => ({...prev, zoom: Math.max(prev.zoom, 14)}));
    setBoundaryText("Drawing/Editing boundary...");
  };
  
  const finishDrawing = () => {
    if (boundaryPoints.length < 3) {
      alert("Boundary requires at least 3 points.");
      return;
    }
    setIsDrawing(false);
    setBoundaryText(`${boundaryPoints.length} points defined.`);
    setOriginalBoundaryPoints([]);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setBoundaryPoints(originalBoundaryPoints);
    if (originalBoundaryPoints.length > 0) setBoundaryText(`${originalBoundaryPoints.length} points defined.`);
    else setBoundaryText("No project boundary defined.");
    setOriginalBoundaryPoints([]);
  };

  // Dialog Actions
  const openBoundaryDialog = () => {
    if (boundaryPoints.length > 0) {
      if (coordinateFormat === 'proj' && hasProjectedCRS) {
          const text = boundaryPoints.map(p => {
              const { e, n } = mockGeoToProj(p.lat, p.lng);
              return `${e.toFixed(3)}, ${n.toFixed(3)}`;
          }).join('\n');
          setBoundaryInputValue(text);
      } else {
          if (coordinateFormat === 'proj' && !hasProjectedCRS) setCoordinateFormat('geo');
          const text = boundaryPoints.map(p => `${p.lat.toFixed(7)}, ${p.lng.toFixed(7)}`).join('\n');
          setBoundaryInputValue(text);
      }
    } else {
      setBoundaryInputValue("");
    }
    setShowBoundaryDialog(true);
  };

  const confirmBoundaryDialog = () => {
    if (previewBoundaryPoints.length > 0) {
        setBoundaryPoints(previewBoundaryPoints);
        setBoundaryText(`${previewBoundaryPoints.length} points defined.`);
        setViewState(prev => ({...prev, lat: previewBoundaryPoints[0].lat, lng: previewBoundaryPoints[0].lng, zoom: 16}));
    } else if (boundaryInputValue.trim() === "") {
         setBoundaryPoints([]);
         setBoundaryText("No project boundary defined.");
    }
    setShowBoundaryDialog(false);
  };

  const switchFormat = (targetFormat: 'geo' | 'proj') => {
    if (targetFormat === coordinateFormat) return;

    // Recalculate input value if points exist, to ensure switching formats in dialog works smoothly
    if (boundaryPoints.length > 0) {
        if (targetFormat === 'proj' && hasProjectedCRS) {
             const text = boundaryPoints.map(p => {
                  const { e, n } = mockGeoToProj(p.lat, p.lng);
                  return `${e.toFixed(3)}, ${n.toFixed(3)}`;
              }).join('\n');
              setBoundaryInputValue(text);
        } else {
             const text = boundaryPoints.map(p => `${p.lat.toFixed(7)}, ${p.lng.toFixed(7)}`).join('\n');
             setBoundaryInputValue(text);
        }
    }
    
    setCoordinateFormat(targetFormat);
  };

  const handleFileSelected = (file: File) => {
    setBoundaryText(`Boundary imported from: ${file.name}`);
    setShowBoundaryFileSelectDialog(false);
    // Here you would typically parse the file content
  };

  return {
    boundaryPoints,
    setBoundaryPoints,
    previewBoundaryPoints,
    isDrawing,
    boundaryText,
    coordinateFormat,
    boundaryInputValue,
    setBoundaryInputValue,
    showBoundaryDialog,
    setShowBoundaryDialog,
    showBoundaryFileSelectDialog,
    setShowBoundaryFileSelectDialog,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    openBoundaryDialog,
    confirmBoundaryDialog,
    switchFormat,
    handleFileSelected
  };
};