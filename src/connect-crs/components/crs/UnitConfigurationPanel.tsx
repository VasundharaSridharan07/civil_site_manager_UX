import React from 'react';
import { ChevronDown, Info } from "lucide-react";

interface UnitConfigurationPanelProps {
  sourceUnit: string;
  selectedUnit: string;
  onUnitChange: (unit: string) => void;
  variant?: 'footer' | 'card';
  className?: string;
}

const UnitConfigurationPanel: React.FC<UnitConfigurationPanelProps> = ({
  sourceUnit,
  selectedUnit,
  onUnitChange,
  variant = 'footer',
  className = ''
}) => {
  const isOverride = sourceUnit !== 'Not defined' && sourceUnit !== selectedUnit;

  if (variant === 'card') {
    return (
      <div className={`bg-white border border-[#d0d0d7] rounded-[2px] p-4 flex flex-col justify-center h-full ${className}`}>
        <div className="flex items-center justify-between mb-1.5">
            <div className="text-[11px] font-bold text-[#6a6976] uppercase tracking-wider">CRS Unit</div>
            {isOverride && (
                <div className="flex items-center gap-1 text-[10px] text-[#a51d25] font-semibold bg-[#a51d25]/5 px-1.5 py-0.5 rounded">
                  <Info className="w-3 h-3" />
                  <span>Override</span>
                </div>
            )}
        </div>
        
        <div className="relative w-full">
          <select 
            value={selectedUnit} 
            onChange={(e) => onUnitChange(e.target.value)} 
            className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-1.5 text-[14px] text-[#363545] outline-none bg-white focus:border-[#005f9e] cursor-pointer appearance-none"
          >
            <option value="Meter">Meter</option>
            <option value="Imperial">Imperial</option>
            <option value="U.S. Survey Feet">U.S. Survey Feet</option>
          </select>
          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-[#6a6976] pointer-events-none" />
        </div>
      </div>
    );
  }

  // Footer variant (default)
  return (
    <div className={`bg-[#f9f9fb] px-[2.5rem] py-4 border-t border-[#d0d0d7] flex items-center justify-between flex-shrink-0 ${className}`}>
      <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[13px] text-[#363545] font-semibold">
            Unit Configuration
          </div>
          {isOverride && (
            <div className="flex items-center gap-1.5 text-[12px] text-[#a51d25]">
              <Info className="w-3.5 h-3.5" />
              <span>Override active</span>
            </div>
          )}
      </div>
      
      <div className="flex items-center gap-3">
        <label className="text-[12px] text-[#6a6976]">Coordinate System Unit</label>
        <div className="relative w-[160px]">
          <select 
            value={selectedUnit} 
            onChange={(e) => onUnitChange(e.target.value)} 
            className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-1.5 text-[13px] text-[#363545] outline-none bg-white focus:border-[#005f9e] cursor-pointer"
          >
            <option value="Meter">Meter</option>
            <option value="Imperial">Imperial</option>
            <option value="U.S. Survey Feet">U.S. Survey Feet</option>
          </select>
          <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-[#6a6976] pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default UnitConfigurationPanel;