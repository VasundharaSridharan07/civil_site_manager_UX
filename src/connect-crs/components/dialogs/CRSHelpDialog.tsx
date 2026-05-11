import React from 'react';
import { X } from "lucide-react";

interface CRSHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CRSHelpDialog: React.FC<CRSHelpDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[35rem] bg-white shadow-xl rounded-[2px]">
        <header className="flex items-center justify-between p-6 pb-2 border-b border-[#d0d0d7]">
          <h2 className="text-[18px] font-bold text-[#363545] m-0">Why use a Coordinate Reference System?</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-6">
          <p className="text-[14px] text-[#6a6976]">To be Done</p>
        </div>
        <footer className="flex justify-end gap-4 p-6 pt-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
          <button 
            onClick={onClose} 
            className="bg-[#005f9e] hover:bg-[#00437b] text-white text-[14px] font-bold py-2 px-6 rounded-[2px]"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CRSHelpDialog;