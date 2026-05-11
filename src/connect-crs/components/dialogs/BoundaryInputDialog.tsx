import React from 'react';
import { X } from "lucide-react";

interface BoundaryInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  value: string;
  onChange: (value: string) => void;
  coordinateFormat: 'geo' | 'proj';
  onFormatChange: (format: 'geo' | 'proj') => void;
  hasProjectedCRS: boolean;
}

const BoundaryInputDialog: React.FC<BoundaryInputDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  value, 
  onChange,
  coordinateFormat,
  onFormatChange,
  hasProjectedCRS
}) => {
  if (!isOpen) return null;

  const placeholderText = coordinateFormat === 'geo' 
    ? "Specify coordinates as pairs of decimal values.\n\nLatitude should be specified before longitude.\n\nUse delimiters such as commas, spaces or new lines between values."
    : "Specify coordinates as pairs of values (Easting, Northing).\n\nUse delimiters such as commas, spaces or new lines between values.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
       <div className="relative flex flex-col w-[35rem] bg-white shadow-xl rounded-[2px]">
          <header className="flex items-start justify-between p-6 pb-2">
             <h2 className="text-[20px] font-bold text-[#363545] m-0">Input Boundary Coordinates</h2>
             <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
          </header>
          
          <div className="px-6 flex justify-between items-end mb-2">
             <p className="text-[14px] text-[#363545] mb-0">Paste or enter coordinates into the box below</p>
             
             {/* Toggle Switch */}
             <div className="flex bg-[#eaeaef] rounded-[2px] p-[2px]">
              <button 
                onClick={() => onFormatChange('geo')}
                className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${coordinateFormat === 'geo' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976] hover:bg-[#d0d0d7]/50'}`}
                title="Geographic coordinates (Latitude, Longitude)"
              >
                (φ,λ)
              </button>
              <button 
                onClick={() => hasProjectedCRS && onFormatChange('proj')}
                className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] transition-colors leading-none ${coordinateFormat === 'proj' ? 'bg-[#6a6976] text-white shadow-sm' : 'text-[#6a6976]'} ${!hasProjectedCRS ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#d0d0d7]/50'}`}
                title="Projected coordinates (Easting, Northing)"
              >
                (E,N)
              </button>
            </div>
          </div>

          <div className="px-6 pb-4">
             <textarea 
                className="w-full h-48 border border-[#d0d0d7] p-3 text-[14px] text-[#363545] font-normal rounded-[2px] outline-none focus:border-[#005f9e] bg-white placeholder:text-[#aeaeb6] placeholder:italic resize-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholderText}
                style={{ whiteSpace: 'pre-line' }}
             />
          </div>

          <footer className="flex justify-end gap-4 p-6 pt-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
             <button onClick={onClose} className="text-[#005f9e] text-[14px] font-bold hover:underline">Cancel</button>
             <button onClick={onConfirm} className="bg-[#005f9e] hover:bg-[#00437b] text-white text-[14px] font-bold py-2 px-6 rounded-[2px]">OK</button>
          </footer>
       </div>
    </div>
  );
};

export default BoundaryInputDialog;