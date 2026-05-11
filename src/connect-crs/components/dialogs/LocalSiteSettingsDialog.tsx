import React, { useState, useEffect } from 'react';
import { X } from "lucide-react";

interface LocalSiteSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (values: {
    lsLat: string;
    lsLng: string;
    lsHeight: string;
    lsScale: string;
    lsNorthing: string;
    lsEasting: string;
  }) => void;
  initialValues: {
    lsLat: string;
    lsLng: string;
    lsHeight: string;
    lsScale: string;
    lsNorthing: string;
    lsEasting: string;
  };
  unitLabel: string;
}

const LocalSiteSettingsDialog: React.FC<LocalSiteSettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialValues,
  unitLabel 
}) => {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
    }
  }, [isOpen, initialValues]);

  const handleChange = (key: keyof typeof values, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[35rem] bg-white shadow-xl rounded-[2px]">
        <header className="flex items-center justify-between p-6 pb-2 border-b border-[#d0d0d7]">
          <h2 className="text-[18px] font-bold text-[#363545] m-0">Local Site Settings</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
        </header>

        <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
           <div>
               <label className="block text-[12px] text-[#6a6976] mb-1">Project Latitude</label>
               <input type="text" value={values.lsLat} onChange={e => handleChange('lsLat', e.target.value)} className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e] bg-white" />
           </div>
           <div>
               <label className="block text-[12px] text-[#6a6976] mb-1">Project Longitude</label>
               <input type="text" value={values.lsLng} onChange={e => handleChange('lsLng', e.target.value)} className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e] bg-white" />
           </div>
           
           <div>
               <label className="block text-[12px] text-[#6a6976] mb-1">Project Height</label>
               <div className="relative">
                 <input type="text" value={values.lsHeight} onChange={e => handleChange('lsHeight', e.target.value)} className="w-full border border-[#d0d0d7] rounded-[2px] pl-3 pr-10 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e] bg-white" />
                 <span className="absolute right-3 top-2 text-[13px] text-[#6a6976] pointer-events-none select-none">{unitLabel}</span>
               </div>
           </div>
           
           <div>
               <label className="block text-[12px] text-[#6a6976] mb-1">Ground Scale Factor</label>
               <input type="text" value={values.lsScale} onChange={e => handleChange('lsScale', e.target.value)} className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none focus:border-[#005f9e] bg-white" />
           </div>
        </div>

        <footer className="flex justify-end gap-4 p-6 pt-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
           <button onClick={onClose} className="text-[#005f9e] text-[14px] font-bold hover:underline">Cancel</button>
           <button 
              onClick={() => onConfirm(values)}
              className="text-white text-[14px] font-bold py-2 px-6 rounded-[2px] bg-[#005f9e] hover:bg-[#00437b]"
           >
             OK
           </button>
        </footer>
      </div>
    </div>
  );
};

export default LocalSiteSettingsDialog;