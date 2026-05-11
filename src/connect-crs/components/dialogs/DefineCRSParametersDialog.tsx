import React, { useState } from 'react';
import { X } from "lucide-react";
import type { CRSItem } from '../../types';

interface DefineCRSParametersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (crs: CRSItem) => void;
}

const DefineCRSParametersDialog: React.FC<DefineCRSParametersDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState("");
  const [projection, setProjection] = useState("Transverse Mercator");
  const [datum, setDatum] = useState("WGS 84");
  
  // Projection Parameters
  const [cm, setCm] = useState("");
  const [latOrigin, setLatOrigin] = useState("");
  const [scale, setScale] = useState("");
  const [falseEasting, setFalseEasting] = useState("");
  const [falseNorthing, setFalseNorthing] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!name) return;
    
    const newCRS: CRSItem = {
      code: "Custom Params",
      name: name,
      area: "Project Location",
      type: "Projected",
      unit: "Meter",
      latLong: "-",
      projection: projection,
      datum: datum
      // In a real app, we'd store the parameters too
    };
    onConfirm(newCRS);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[40rem] max-h-[90vh] bg-white shadow-xl rounded-[2px] overflow-hidden">
        <header className="flex items-center justify-between p-6 pb-2 border-b border-[#d0d0d7]">
          <h2 className="text-[18px] font-bold text-[#363545] m-0">Define Custom Horizontal CRS</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
           <div className="mb-6">
              <label className="block text-[12px] text-[#6a6976] mb-1 font-semibold">System Name</label>
              <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for your custom system"
                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]"
              />
           </div>

           <div className="grid grid-cols-2 gap-6">
               <div className="col-span-2">
                   <label className="block text-[12px] text-[#6a6976] mb-1">Projection Method</label>
                   <select 
                      value={projection}
                      onChange={(e) => setProjection(e.target.value)}
                      className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]"
                   >
                       <option value="Transverse Mercator">Transverse Mercator</option>
                       <option value="Lambert Conic Conformal (2SP)">Lambert Conic Conformal (2SP)</option>
                       <option value="Oblique Stereographic">Oblique Stereographic</option>
                       <option value="Mercator">Mercator</option>
                   </select>
               </div>

               <div className="col-span-2">
                   <label className="block text-[12px] text-[#6a6976] mb-1">Reference Datum</label>
                   <select 
                      value={datum}
                      onChange={(e) => setDatum(e.target.value)}
                      className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]"
                   >
                       <option value="WGS 84">WGS 84</option>
                       <option value="NAD83">NAD83</option>
                       <option value="ETRS89">ETRS89</option>
                       <option value="GDA2020">GDA2020</option>
                       <option value="Custom">Custom Ellipsoid...</option>
                   </select>
               </div>

               {/* Parameters */}
               <div>
                   <label className="block text-[12px] text-[#6a6976] mb-1">Central Meridian</label>
                   <input type="text" value={cm} onChange={e => setCm(e.target.value)} placeholder="0.000000000" className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]" />
               </div>
               <div>
                   <label className="block text-[12px] text-[#6a6976] mb-1">Latitude of Origin</label>
                   <input type="text" value={latOrigin} onChange={e => setLatOrigin(e.target.value)} placeholder="0.000000000" className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]" />
               </div>
               <div>
                   <label className="block text-[12px] text-[#6a6976] mb-1">Scale Factor</label>
                   <input type="text" value={scale} onChange={e => setScale(e.target.value)} placeholder="1.00000000" className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]" />
               </div>
               <div></div>
               <div>
                   <label className="block text-[12px] text-[#6a6976] mb-1">False Easting</label>
                   <input type="text" value={falseEasting} onChange={e => setFalseEasting(e.target.value)} placeholder="0.000" className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]" />
               </div>
               <div>
                   <label className="block text-[12px] text-[#6a6976] mb-1">False Northing</label>
                   <input type="text" value={falseNorthing} onChange={e => setFalseNorthing(e.target.value)} placeholder="0.000" className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]" />
               </div>
           </div>
        </div>

        <footer className="flex justify-end gap-4 p-6 pt-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
           <button onClick={onClose} className="text-[#005f9e] text-[14px] font-bold hover:underline">Cancel</button>
           <button 
              onClick={handleConfirm}
              disabled={!name}
              className={`text-white text-[14px] font-bold py-2 px-6 rounded-[2px] ${!name ? 'bg-[#aeb0b6] cursor-not-allowed' : 'bg-[#005f9e] hover:bg-[#00437b]'}`}
           >
             Create Custom CRS
           </button>
        </footer>
      </div>
    </div>
  );
};

export default DefineCRSParametersDialog;