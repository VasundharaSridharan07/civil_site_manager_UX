import React, { useState } from 'react';
import { Pencil } from "lucide-react";
import ProjectLocationBoundaryDialog from './dialogs/ProjectLocationBoundaryDialog';

interface BoundarySectionProps {
  boundaryText: string;
  coordinateFormat: 'geo' | 'proj';
  setCoordinateFormat: (format: 'geo' | 'proj') => void;
  hasProjectedCRS: boolean;
  isDrawing: boolean;
  onStartDrawing: () => void;
  onOpenBoundaryDialog: () => void;
  onOpenBoundaryFileSelect: () => void;
}

const BoundarySection: React.FC<BoundarySectionProps> = ({
  boundaryText,
  coordinateFormat,
  setCoordinateFormat,
  hasProjectedCRS,
  isDrawing,
  onStartDrawing,
  onOpenBoundaryDialog,
  onOpenBoundaryFileSelect
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDrawBoundary = () => {
    setIsDialogOpen(false);
    onStartDrawing();
  };

  const handleInputCoordinates = () => {
    setIsDialogOpen(false);
    onOpenBoundaryDialog();
  };

  const handleUploadFile = () => {
    setIsDialogOpen(false);
    onOpenBoundaryFileSelect();
  };

  return (
    <>
      <div className="mb-6 relative">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <label className="block text-[12px] text-[#6a6976]">Project Boundary</label>
              <div className="flex bg-[#eaeaef] rounded-[2px] p-[2px]">
                <button 
                  onClick={() => setCoordinateFormat('geo')}
                  className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${coordinateFormat === 'geo' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976] hover:bg-[#d0d0d7]/50'}`}
                  title="View project boundary using geographic coordinates - latitude, longitude"
                >
                  (φ,λ)
                </button>
                <button 
                  onClick={() => hasProjectedCRS && setCoordinateFormat('proj')}
                  className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${coordinateFormat === 'proj' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976]'} ${!hasProjectedCRS ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#d0d0d7]/50'}`}
                  title="View project boundary with cartesian coordinates in a projected CRS. Requires that a projected CRS is selected."
                >
                  (E,N)
                </button>
              </div>
            </div>
            <div className="text-[14px] text-[#363545]">{boundaryText}</div>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={() => !isDrawing && setIsDialogOpen(true)}
              className={`bg-[#eaeaef] hover:bg-[#d0d0d7] border border-[#d0d0d7] p-2 rounded-[2px] ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isDrawing}
            >
              <Pencil className="w-4 h-4 text-[#363545]" />
            </button>
          </div>
        </div>
      </div>

      <ProjectLocationBoundaryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onDrawBoundary={handleDrawBoundary}
        onInputCoordinates={handleInputCoordinates}
        onUploadFile={handleUploadFile}
      />
    </>
  );
};

export default BoundarySection;