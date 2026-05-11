import React, { useRef, useState, useEffect } from 'react';
import { X, FileUp, FileText } from "lucide-react";

interface BoundaryFileSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
}

const BoundaryFileSelectDialog: React.FC<BoundaryFileSelectDialogProps> = ({ isOpen, onClose, onFileSelected }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
       <div className="relative flex flex-col w-[35rem] bg-white shadow-xl rounded-[2px]">
          <header className="flex items-start justify-between p-6 pb-2">
             <h2 className="text-[20px] font-bold text-[#363545] m-0">Upload Boundary from File</h2>
             <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
          </header>
          
          <div className="px-6 pb-6">
             <p className="text-[14px] text-[#6a6976] mb-6">
               Upload a local file to define the project boundary. Supported formats: <span className="bg-[#f3f3f7] px-1 py-0.5 rounded border border-[#d0d0d7] text-[12px] font-mono">.csv</span>, <span className="bg-[#f3f3f7] px-1 py-0.5 rounded border border-[#d0d0d7] text-[12px] font-mono">.dxf</span>.
             </p>

             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
               accept=".csv,.dxf" 
             />
             
             <div 
               className={`border-2 border-dashed ${selectedFile ? 'border-[#005f9e] bg-[#e5f0f8]/30' : 'border-[#d0d0d7] hover:bg-[#f9f9fb]'} rounded-[2px] h-[200px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors`} 
               onClick={() => fileInputRef.current?.click()}
               onDragOver={handleDragOver}
               onDrop={handleDrop}
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
                      <div className="mb-4">
                         <FileUp className="w-10 h-10 text-[#9ca3af]" strokeWidth={1.5} />
                      </div>
                      <p className="text-[16px] text-[#005f9e] font-bold mb-1">Click to browse files</p>
                      <p className="text-[14px] text-[#6a6976]">or drag and drop here</p>
                   </>
                )}
             </div>
          </div>

          <footer className="flex justify-end gap-4 px-6 pb-6 pt-4 border-t border-[#d0d0d7] bg-white">
             <button onClick={onClose} className="text-[#363545] text-[14px] font-bold hover:underline">Cancel</button>
             <button 
               onClick={handleConfirm}
               disabled={!selectedFile}
               className={`text-white text-[14px] font-bold py-2 px-6 rounded-[2px] ${selectedFile ? 'bg-[#005f9e] hover:bg-[#00437b]' : 'bg-[#d0d0d7] cursor-not-allowed'}`}
             >
               OK
             </button>
          </footer>
       </div>
    </div>
  );
};

export default BoundaryFileSelectDialog;