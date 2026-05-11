import React, { useState, useRef } from 'react';
import { X, Upload, FileText } from "lucide-react";
import type { CRSItem } from '../../types';

interface UploadGridFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (crs: CRSItem) => void;
}

const UploadGridFileDialog: React.FC<UploadGridFileDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setSelectedFile(file);
        if (!name) setName(file.name.split('.')[0]); // Auto-fill name
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
        setSelectedFile(file);
        if (!name) setName(file.name.split('.')[0]);
    }
  };

  const handleConfirm = () => {
    if (!name || !selectedFile) return;

    const newCRS: CRSItem = {
        code: "Custom File",
        name: name,
        area: "Project Location",
        type: "Projected",
        unit: "Meter",
        latLong: "-",
        projection: "Grid Transformation",
        datum: "Custom"
    };
    onConfirm(newCRS);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[35rem] bg-white shadow-xl rounded-[2px]">
        <header className="flex items-center justify-between p-6 pb-2 border-b border-[#d0d0d7]">
          <h2 className="text-[18px] font-bold text-[#363545] m-0">Upload Horizontal Grid File</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
        </header>

        <div className="p-6">
           <div className="mb-6">
              <label className="block text-[12px] text-[#6a6976] mb-1 font-semibold">Custom System Name</label>
              <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for your custom system"
                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]"
              />
           </div>

           <p className="text-[14px] text-[#363545] mb-4">
              Upload a Datum Grid File (DGF) or Shift Grid File (SGF) to define the horizontal transformation.
           </p>
           
           <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".dgf,.sgf" 
           />

           <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[2px] h-[180px] flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedFile ? 'border-[#005f9e] bg-[#e5f0f8]/30' : 'border-[#d0d0d7] hover:bg-[#f9f9fb] hover:border-[#aeaeb6]'}`}
           >
               {selectedFile ? (
                   <>
                      <FileText className="w-10 h-10 text-[#005f9e] mb-4" strokeWidth={1.5} />
                      <p className="text-[16px] text-[#363545] font-bold mb-1">{selectedFile.name}</p>
                      <p className="text-[12px] text-[#6a6976]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      <p className="text-[12px] text-[#005f9e] mt-4 hover:underline">Click to change file</p>
                   </>
                ) : (
                   <>
                      <div className="w-12 h-12 rounded bg-[#f3f3f7] flex items-center justify-center mb-4 border border-[#d0d0d7]">
                         <Upload className="w-6 h-6 text-[#6a6976]" />
                      </div>
                      <div className="text-[16px] font-bold text-[#005f9e] mb-1">Click to browse DGF/SGF files</div>
                      <div className="text-[14px] text-[#6a6976]">or drag and drop here</div>
                   </>
                )}
           </div>
        </div>

        <footer className="flex justify-end gap-4 p-6 pt-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
           <button onClick={onClose} className="text-[#005f9e] text-[14px] font-bold hover:underline">Cancel</button>
           <button 
              onClick={handleConfirm}
              disabled={!selectedFile}
              className={`text-white text-[14px] font-bold py-2 px-6 rounded-[2px] ${selectedFile ? 'bg-[#005f9e] hover:bg-[#00437b]' : 'bg-[#aeb0b6] cursor-not-allowed'}`}
           >
             OK
           </button>
        </footer>
      </div>
    </div>
  );
};

export default UploadGridFileDialog;