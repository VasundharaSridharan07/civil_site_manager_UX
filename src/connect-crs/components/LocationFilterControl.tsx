import React from 'react';
import { Globe, MapPin } from "lucide-react";
import ToggleSwitch from './ToggleSwitch';

interface LocationFilterControlProps {
  hasLocation: boolean;
  isEnabled?: boolean;
  onToggle?: (checked: boolean) => void;
  className?: string;
  chipOnly?: boolean;
}

const LocationFilterControl: React.FC<LocationFilterControlProps> = ({ 
  hasLocation, 
  isEnabled, 
  onToggle, 
  className = "",
  chipOnly = false
}) => {
  // Chip-only mode: just show the location status badge
  if (chipOnly) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] border transition-colors select-none
        ${hasLocation 
          ? 'bg-[#e5f0f8] border-[#e5f0f8] text-[#005f9e]' 
          : 'bg-[#f3f3f7] border-[#d0d0d7] text-[#6a6976]'
        } ${className}`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-[12px] font-semibold">
          {hasLocation ? 'Location detected from map' : 'No location defined'}
        </span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Left Side: Toggle Switch with Label */}
      {isEnabled !== undefined && onToggle && (
        <ToggleSwitch 
          checked={isEnabled} 
          onChange={onToggle} 
          disabled={!hasLocation}
          disabledTooltip="Set a project location first to enable this filter"
          label={
            <>
              <MapPin className="w-4 h-4 text-[#6a6976] flex-shrink-0" />
              Filter by project location
            </>
          }
        />
      )}
      
      {/* Right Side: Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] border transition-colors select-none
        ${hasLocation 
          ? 'bg-[#e5f0f8] border-[#e5f0f8] text-[#005f9e]' 
          : 'bg-[#f3f3f7] border-[#d0d0d7] text-[#6a6976]'
        }`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-[12px] font-semibold">
          {hasLocation ? 'Location detected from map' : 'No location defined'}
        </span>
      </div>
    </div>
  );
};

export default LocationFilterControl;