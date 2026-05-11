// @ts-nocheck
import React from 'react';
import { Search, Filter, ChevronDown, Ruler, MapPin } from "lucide-react";
import ToggleSwitch from '../ToggleSwitch';

interface CRSFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  /** Optional chip/content rendered inside the search bar (e.g. "Searching by EPSG code"). */
  searchBarChip?: React.ReactNode;
  hasLocation: boolean;
  filterByLocation: boolean;
  onLocationFilterToggle: (enabled: boolean) => void;
  /** When true, hide the "Filter by project location" toggle (e.g. when API always requires spatial filter). */
  hideLocationFilter?: boolean;
  unitFilter?: string;
  onUnitFilterChange?: (unit: string) => void;
  layout?: 'stacked' | 'inline' | 'buttons-right';
}

const LOCATION_DISABLED_TOOLTIP = "Set a project location first to enable this filter";

const CRSFilterBar: React.FC<CRSFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search by name, code...",
  searchBarChip,
  hasLocation,
  filterByLocation,
  onLocationFilterToggle,
  hideLocationFilter = false,
  unitFilter,
  onUnitFilterChange,
  layout = 'stacked'
}) => {
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit?.();
    }
  };
  
  const locationToggle = !hideLocationFilter ? (
    <ToggleSwitch 
      checked={filterByLocation} 
      onChange={onLocationFilterToggle} 
      disabled={!hasLocation}
      disabledTooltip={LOCATION_DISABLED_TOOLTIP}
      label={
        <>
          <MapPin className="w-4 h-4 text-[#6a6976] flex-shrink-0" />
          Filter by project location
        </>
      }
    />
  ) : null;

  if (layout === 'buttons-right') {
    return (
      <div className="flex items-center gap-3">
        <div className={`flex-1 flex items-center gap-2 border border-[#d0d0d7] rounded-[2px] bg-white focus-within:border-[#005f9e] ${searchBarChip ? 'pl-2 py-1.5' : ''}`}>
          {searchBarChip}
          <div className="relative flex-1 min-w-0">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              className={`w-full py-2 pr-4 text-[14px] text-[#363545] outline-none bg-transparent border-0 ${searchBarChip ? 'pl-2' : 'pl-9'}`}
              autoFocus
            />
            {!searchBarChip && <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#aeaeb6] pointer-events-none" />}
          </div>
        </div>
        
        {locationToggle}
        
        {unitFilter && onUnitFilterChange && (
          <div className="relative flex items-center">
            <Ruler className="absolute left-2.5 w-4 h-4 text-[#6a6976] pointer-events-none z-10" />
            <select 
              value={unitFilter}
              onChange={(e) => onUnitFilterChange(e.target.value)}
              className="border border-[#d0d0d7] rounded-[2px] pl-8 pr-8 py-2 text-[13px] text-[#363545] outline-none bg-white focus:border-[#005f9e] cursor-pointer h-9 appearance-none"
            >
              <option value="All">All Units</option>
              <option value="Meter">Meter</option>
              <option value="Imperial">Imperial</option>
              <option value="U.S. Survey Feet">U.S. Survey Feet</option>
            </select>
            <ChevronDown className="absolute right-2 w-3 h-3 text-[#6a6976] pointer-events-none" />
          </div>
        )}
      </div>
    );
  }
  
  if (layout === 'inline') {
    return (
      <div className="flex items-center gap-4">
        <div className={`flex-1 flex items-center gap-2 border border-[#d0d0d7] rounded-[2px] bg-white focus-within:border-[#005f9e] ${searchBarChip ? 'pl-2 py-1.5' : ''}`}>
          {searchBarChip}
          <div className="relative flex-1 min-w-0">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              className={`w-full py-2 pr-4 text-[14px] text-[#363545] outline-none bg-transparent border-0 ${searchBarChip ? 'pl-2' : 'pl-9'}`}
              autoFocus
            />
            {!searchBarChip && <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#aeaeb6] pointer-events-none" />}
          </div>
        </div>
        
        {locationToggle}
        
        {unitFilter && onUnitFilterChange && (
            <div className="relative flex items-center flex-shrink-0">
              <Ruler className="absolute left-2.5 w-4 h-4 text-[#6a6976] pointer-events-none z-10" />
              <select 
                value={unitFilter}
                onChange={(e) => onUnitFilterChange(e.target.value)}
                className="border border-[#d0d0d7] rounded-[2px] pl-8 pr-8 py-1 text-[13px] text-[#363545] outline-none bg-white focus:border-[#005f9e] cursor-pointer appearance-none"
              >
                <option value="All">All Units</option>
                <option value="Meter">Meter</option>
                <option value="Imperial">Imperial</option>
                <option value="U.S. Survey Feet">U.S. Survey Feet</option>
              </select>
              <ChevronDown className="absolute right-2 w-3 h-3 text-[#6a6976] pointer-events-none" />
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={`flex items-center gap-2 border border-[#d0d0d7] rounded-[2px] bg-white focus-within:border-[#005f9e] ${searchBarChip ? 'pl-2 py-1.5' : ''}`}>
        {searchBarChip}
        <div className="relative flex-1 min-w-0">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            className={`w-full py-2 pr-4 text-[14px] text-[#363545] outline-none bg-transparent border-0 ${searchBarChip ? 'pl-2' : 'pl-9'}`}
            autoFocus
          />
          {!searchBarChip && <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#aeaeb6] pointer-events-none" />}
        </div>
      </div>
      
      {/* Filter Toolbar */}
      <div className="flex items-center gap-4">
        {!hideLocationFilter && (
          <ToggleSwitch 
            checked={filterByLocation} 
            onChange={onLocationFilterToggle} 
            disabled={!hasLocation}
            disabledTooltip={LOCATION_DISABLED_TOOLTIP}
            label={
              <>
                <MapPin className="w-4 h-4 text-[#6a6976] flex-shrink-0" />
                Filter by project location
              </>
            }
            className="flex-1"
          />
        )}

        {unitFilter && onUnitFilterChange && (
          <>
            <div className="h-6 w-px bg-[#d0d0d7]"></div>
            <div className="relative flex items-center">
              <Ruler className="absolute left-2.5 w-4 h-4 text-[#6a6976] pointer-events-none z-10" />
              <select 
                value={unitFilter}
                onChange={(e) => onUnitFilterChange(e.target.value)}
                className="border border-[#d0d0d7] rounded-[2px] pl-8 pr-8 py-1 text-[13px] text-[#363545] outline-none bg-white focus:border-[#005f9e] cursor-pointer appearance-none"
              >
                <option value="All">All Units</option>
                <option value="Meter">Meter</option>
                <option value="Imperial">Imperial</option>
                <option value="U.S. Survey Feet">U.S. Survey Feet</option>
              </select>
              <ChevronDown className="absolute right-2 w-3 h-3 text-[#6a6976] pointer-events-none" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CRSFilterBar;
