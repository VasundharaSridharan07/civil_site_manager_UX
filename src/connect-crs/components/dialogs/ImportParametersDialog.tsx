import React from 'react';
import { X } from "lucide-react";

interface ImportParametersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ImportParametersDialog: React.FC<ImportParametersDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[30rem] bg-white shadow-xl rounded-[2px]">
        <header className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-[18px] font-bold text-[#363545]">Import Parameters</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-6">
          <p className="text-[14px] text-[#6a6976]">to be done</p>
        </div>
        <footer className="flex justify-end gap-4 p-6 pt-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
          <button onClick={onClose} className="text-[#363545] text-[14px] font-bold hover:underline">Cancel</button>
          <button 
            onClick={onConfirm} 
            className="bg-[#005f9e] hover:bg-[#00437b] text-white text-[14px] font-bold py-2 px-6 rounded-[2px]"
          >
            OK
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ImportParametersDialog;