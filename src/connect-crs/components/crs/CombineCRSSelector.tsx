// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Plus, Search, Upload, FileText, X, Settings, Database, Globe } from "lucide-react";
import type { CRSItem } from '../../types';
import { useCRSFilter } from '../../hooks/useCRSFilter';
import CRSFilterBar from './CRSFilterBar';
import CRSTable from './CRSTable';
import DefineCRSParametersDialog from '../dialogs/DefineCRSParametersDialog';
import UploadGridFileDialog from '../dialogs/UploadGridFileDialog';
import UnitConfigurationPanel from './UnitConfigurationPanel';

interface CombineCRSSelectorProps {
  allData: CRSItem[];
  horizontalCRS: CRSItem | null;
  verticalCRS: CRSItem | null;
  onSelectHorizontal: (item: CRSItem) => void;
  onSelectVertical: (item: CRSItem) => void;
  location?: { lat: number, lng: number } | null;
  serverLocation?: string;
  selectedUnit: string;
  onUnitChange: (unit: string) => void;
}

const CombineCRSSelector: React.FC<CombineCRSSelectorProps> = ({
  allData,
  horizontalCRS,
  verticalCRS,
  onSelectHorizontal,
  onSelectVertical,
  location,
  serverLocation,
  selectedUnit,
  onUnitChange
}) => {
  const [activeSlot, setActiveSlot] = useState<'horizontal' | 'vertical'>('horizontal');
  const [horizontalTab, setHorizontalTab] = useState<'library' | 'custom'>('library');
  const [verticalTab, setVerticalTab] = useState<'library' | 'upload'>('library');
  
  // Dialog State
  const [showDefineParamsDialog, setShowDefineParamsDialog] = useState(false);
  const [showUploadGridDialog, setShowUploadGridDialog] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByLocation, setFilterByLocation] = useState(!!location);
  const [unitFilter, setUnitFilter] = useState("All");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom filter logic based on active slot
  const slotFilter = (item: CRSItem) => {
    if (item.type === 'Compound') return false; 
    if (activeSlot === 'horizontal' && item.type === 'Vertical') return false;
    // In vertical slot (library mode), show verticals
    if (activeSlot === 'vertical' && item.type !== 'Vertical') return false;
    return true;
  };

  const { filteredAndSortedItems, sortConfig, handleSort } = useCRSFilter({
    data: allData,
    searchQuery,
    location,
    serverLocation,
    filterByLocation,
    unitFilter,
    customFilter: slotFilter
  });

  const handleSelect = (item: CRSItem) => {
    if (activeSlot === 'horizontal') {
      onSelectHorizontal(item);
      if (!verticalCRS) {
          setActiveSlot('vertical');
          setVerticalTab('library');
      }
    } else {
      onSelectVertical(item);
    }
  };
  
  // Vertical Geoid Upload
  const handleVerticalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const geoidCRS: CRSItem = {
          code: "Custom Geoid",
          name: file.name,
          area: "Project Location",
          type: "Vertical",
          unit: "Meter",
          latLong: "-",
          verticalDatum: "Custom Geoid",
          geoid: file.name
      };
      
      onSelectVertical(geoidCRS);
      e.target.value = ''; 
  };
  
  const handleVerticalDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
          const geoidCRS: CRSItem = {
              code: "Custom Geoid",
              name: file.name,
              area: "Project Location",
              type: "Vertical",
              unit: "Meter",
              latLong: "-",
              verticalDatum: "Custom Geoid",
              geoid: file.name
          };
          onSelectVertical(geoidCRS);
      }
  };

  // Handler for completion from custom horizontal dialogs
  const handleCustomHorizontalDefined = (crs: CRSItem) => {
    onSelectHorizontal(crs);
    setShowDefineParamsDialog(false);
    setShowUploadGridDialog(false);
    // Auto advance
    if (!verticalCRS) {
        setActiveSlot('vertical');
        setVerticalTab('library');
    }
  };

  const hasLocation = !!location;
  const hiddenColumns = activeSlot === 'horizontal' ? ['latLong'] : ['latLong', 'type'];

  const isVerticalCustom = verticalCRS?.code === 'Custom Geoid';
  const isHorizontalCustom = horizontalCRS?.code === 'Custom Params' || horizontalCRS?.code === 'Custom File';

  return (
    <>
      <div className="bg-[#f3f3f7] border-b border-[#d0d0d7] p-[2.5rem] pb-6 flex-shrink-0">
        <p className="text-[14px] text-[#6a6976] mb-4">Build a baseline compound system by manually combining a horizontal and a vertical component.</p>
        
        {/* Selection Grid */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-stretch">
          
          {/* Horizontal Column */}
          <div className="flex flex-col">
              <div 
                onClick={() => setActiveSlot('horizontal')}
                className={`bg-white border rounded-[2px] p-4 cursor-pointer transition-all relative h-full ${activeSlot === 'horizontal' ? 'border-[#005f9e] ring-1 ring-[#005f9e] shadow-sm' : 'border-[#d0d0d7] hover:border-[#aeaeb6]'}`}
              >
                <div className="text-[11px] font-bold text-[#6a6976] uppercase tracking-wider mb-1">Horizontal CRS</div>
                {horizontalCRS ? (
                  <div className="text-[14px] text-[#363545] truncate">
                    {isHorizontalCustom ? (
                        <div className="flex items-center gap-2">
                            {horizontalCRS.code === 'Custom File' ? <FileText className="w-4 h-4 text-[#005f9e]" /> : <Settings className="w-4 h-4 text-[#005f9e]" />}
                            <span className="font-semibold text-[#363545]">{horizontalCRS.name}</span>
                            <span className="text-[11px] bg-[#e5f0f8] text-[#005f9e] px-1.5 rounded">Custom</span>
                        </div>
                    ) : (
                        <>
                            <span className="font-bold text-[#005f9e]">{horizontalCRS.code}</span>
                            <span className="text-[#363545] mx-1">:</span>
                            {horizontalCRS.name} <span className="text-[#d0d0d7] mx-1">|</span> <span className="text-[#6a6976] text-[13px]">Unit: {horizontalCRS.unit}</span>
                        </>
                    )}
                  </div>
                ) : (
                  <div className="text-[14px] text-[#aeaeb6] italic">Select a projected or geographic CRS...</div>
                )}
              </div>
          </div>
          
          {/* Plus Icon */}
          <div className="flex items-center justify-center h-full">
              <Plus className="w-5 h-5 text-[#aeaeb6]" />
          </div>
          
          {/* Vertical Column */}
          <div className="flex flex-col">
              <div 
                onClick={() => setActiveSlot('vertical')}
                className={`bg-white border rounded-[2px] p-4 cursor-pointer transition-all relative h-full ${activeSlot === 'vertical' ? 'border-[#005f9e] ring-1 ring-[#005f9e] shadow-sm' : 'border-[#d0d0d7] hover:border-[#aeaeb6]'}`}
              >
                <div className="text-[11px] font-bold text-[#6a6976] uppercase tracking-wider mb-1">Vertical CRS</div>
                {verticalCRS ? (
                  <div className="text-[14px] text-[#363545] truncate">
                    {isVerticalCustom ? (
                        <div className="flex items-center gap-2">
                             <FileText className="w-4 h-4 text-[#005f9e]" />
                             <span className="font-semibold text-[#363545]">{verticalCRS.name}</span>
                             <span className="text-[11px] bg-[#e5f0f8] text-[#005f9e] px-1.5 rounded">Custom Geoid</span>
                        </div>
                    ) : (
                        <>
                            <span className="font-bold text-[#005f9e]">{verticalCRS.code}</span>
                            <span className="text-[#363545] mx-1">:</span>
                            {verticalCRS.name} <span className="text-[#d0d0d7] mx-1">|</span> <span className="text-[#6a6976] text-[13px]">Unit: {verticalCRS.unit}</span>
                        </>
                    )}
                  </div>
                ) : (
                  <div className="text-[14px] text-[#aeaeb6] italic">Select a vertical CRS or upload geoid...</div>
                )}
              </div>
          </div>

          {/* Unit Configuration - Side Panel */}
          <div className="w-[300px]">
             {horizontalCRS && (
                <UnitConfigurationPanel 
                    sourceUnit={horizontalCRS.unit}
                    selectedUnit={selectedUnit}
                    onUnitChange={onUnitChange}
                    variant="card"
                />
              )}
          </div>

        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden bg-white">
          
          {/* TAB BAR FOR ACTIVE SLOT */}
          <div className="flex px-[2.5rem] border-b border-[#d0d0d7] flex-shrink-0">
             {activeSlot === 'horizontal' ? (
                <>
                    <button 
                        onClick={() => setHorizontalTab('library')}
                        className={`py-3 px-4 text-[13px] font-semibold border-b-2 transition-colors ${horizontalTab === 'library' ? 'border-[#005f9e] text-[#005f9e]' : 'border-transparent text-[#6a6976] hover:text-[#363545]'}`}
                    >
                        Choose Published Horizontal CRS
                    </button>
                    <button 
                        onClick={() => setHorizontalTab('custom')}
                        className={`py-3 px-4 text-[13px] font-semibold border-b-2 transition-colors ${horizontalTab === 'custom' ? 'border-[#005f9e] text-[#005f9e]' : 'border-transparent text-[#6a6976] hover:text-[#363545]'}`}
                    >
                        Define Custom Horizontal CRS
                    </button>
                </>
             ) : (
                <>
                    <button 
                        onClick={() => setVerticalTab('library')}
                        className={`py-3 px-4 text-[13px] font-semibold border-b-2 transition-colors ${verticalTab === 'library' ? 'border-[#005f9e] text-[#005f9e]' : 'border-transparent text-[#6a6976] hover:text-[#363545]'}`}
                    >
                        Choose Published Vertical CRS
                    </button>
                    <button 
                        onClick={() => setVerticalTab('upload')}
                        className={`py-3 px-4 text-[13px] font-semibold border-b-2 transition-colors ${verticalTab === 'upload' ? 'border-[#005f9e] text-[#005f9e]' : 'border-transparent text-[#6a6976] hover:text-[#363545]'}`}
                    >
                        Upload Custom Geoid
                    </button>
                </>
             )}
          </div>

          {/* HORIZONTAL CONTENT */}
          {activeSlot === 'horizontal' && (
              <>
                 {horizontalTab === 'library' && (
                     <>
                        <div className="px-[2.5rem] py-4 bg-white border-b border-[#d0d0d7] flex-shrink-0">
                            <CRSFilterBar 
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                searchPlaceholder="Filter horizontal components..."
                                hasLocation={hasLocation}
                                filterByLocation={filterByLocation}
                                onLocationFilterToggle={setFilterByLocation}
                                unitFilter={unitFilter}
                                onUnitFilterChange={setUnitFilter}
                                layout="inline"
                            />
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col bg-white">
                            <CRSTable 
                                items={filteredAndSortedItems.slice(0, 100)} 
                                selectedItem={horizontalCRS}
                                onSelect={handleSelect}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                variant="component"
                                hiddenColumns={hiddenColumns}
                                emptyMessage={searchQuery ? 'No results found.' : 'No components found for this region.'}
                            />
                        </div>
                     </>
                 )}

                 {horizontalTab === 'custom' && (
                     <div className="flex-1 overflow-y-auto p-[2.5rem] bg-white">
                        <h3 className="text-[16px] font-bold text-[#363545] mb-6">How do you want to define your horizontal CRS?</h3>
                        
                        <div className="grid grid-cols-2 gap-6 max-w-4xl">
                             {/* Option 1: Parameters */}
                             <button 
                                onClick={() => setShowDefineParamsDialog(true)}
                                className="flex flex-col items-start p-6 border border-[#d0d0d7] rounded-[2px] hover:border-[#005f9e] hover:shadow-md transition-all text-left bg-white group"
                             >
                                <div className="w-12 h-12 rounded bg-[#f3f3f7] flex items-center justify-center mb-4 group-hover:bg-[#e5f0f8]">
                                    <Settings className="w-6 h-6 text-[#363545] group-hover:text-[#005f9e]" />
                                </div>
                                <h4 className="text-[16px] font-bold text-[#363545] mb-2 group-hover:text-[#005f9e]">Define via Parameters</h4>
                                <p className="text-[13px] text-[#6a6976]">
                                    Manually enter projection parameters (Transverse Mercator, Lambert, etc.) and datum details.
                                </p>
                             </button>

                             {/* Option 2: Upload File */}
                             <button 
                                onClick={() => setShowUploadGridDialog(true)}
                                className="flex flex-col items-start p-6 border border-[#d0d0d7] rounded-[2px] hover:border-[#005f9e] hover:shadow-md transition-all text-left bg-white group"
                             >
                                <div className="w-12 h-12 rounded bg-[#f3f3f7] flex items-center justify-center mb-4 group-hover:bg-[#e5f0f8]">
                                    <Upload className="w-6 h-6 text-[#363545] group-hover:text-[#005f9e]" />
                                </div>
                                <h4 className="text-[16px] font-bold text-[#363545] mb-2 group-hover:text-[#005f9e]">Upload Grid File</h4>
                                <p className="text-[13px] text-[#6a6976]">
                                    Upload a Datum Grid File (DGF) or Shift Grid File (SGF) to define the horizontal transformation.
                                </p>
                             </button>
                        </div>
                     </div>
                 )}
              </>
          )}

          {/* VERTICAL CONTENT */}
          {activeSlot === 'vertical' && (
               <>
                  {verticalTab === 'library' && (
                      <>
                        <div className="px-[2.5rem] py-4 bg-white border-b border-[#d0d0d7] flex-shrink-0">
                            <CRSFilterBar 
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                searchPlaceholder="Filter vertical components..."
                                hasLocation={hasLocation}
                                filterByLocation={filterByLocation}
                                onLocationFilterToggle={setFilterByLocation}
                                unitFilter={unitFilter}
                                onUnitFilterChange={setUnitFilter}
                                layout="inline"
                            />
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col bg-white">
                            <CRSTable 
                                items={filteredAndSortedItems.slice(0, 100)} 
                                selectedItem={verticalCRS}
                                onSelect={handleSelect}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                variant="component"
                                hiddenColumns={hiddenColumns}
                                emptyMessage="No vertical systems found."
                            />
                        </div>
                      </>
                  )}
                  
                  {verticalTab === 'upload' && (
                      <div className="flex-1 p-[2.5rem] flex flex-col">
                          <p className="text-[14px] text-[#363545] mb-6">
                            Upload a custom geoid file to define the vertical component of your coordinate system. 
                            Supported formats: <span className="bg-[#f3f3f7] border border-[#d0d0d7] px-1 rounded font-mono text-[12px]">.ggf</span>, <span className="bg-[#f3f3f7] border border-[#d0d0d7] px-1 rounded font-mono text-[12px]">.bin</span>, <span className="bg-[#f3f3f7] border border-[#d0d0d7] px-1 rounded font-mono text-[12px]">.xml</span>
                          </p>
                          
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleVerticalFileUpload} 
                            className="hidden" 
                            accept=".ggf,.bin,.xml" 
                          />

                          <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleVerticalDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-[2px] h-[200px] flex flex-col items-center justify-center cursor-pointer transition-colors
                                ${isVerticalCustom ? 'border-[#005f9e] bg-[#e5f0f8]/30' : 'border-[#d0d0d7] hover:bg-[#f9f9fb] hover:border-[#aeaeb6]'}
                            `}
                          >
                             {isVerticalCustom && verticalCRS ? (
                                 <>
                                    <FileText className="w-12 h-12 text-[#005f9e] mb-3" />
                                    <div className="text-[16px] font-bold text-[#363545]">{verticalCRS.name}</div>
                                    <div className="text-[12px] text-[#6a6976] mt-1">Custom Geoid File Selected</div>
                                    <div className="text-[12px] text-[#005f9e] mt-4 hover:underline">Click to replace file</div>
                                 </>
                             ) : (
                                 <>
                                    <div className="w-12 h-12 rounded bg-[#f3f3f7] flex items-center justify-center mb-4 border border-[#d0d0d7]">
                                        <Upload className="w-6 h-6 text-[#6a6976]" />
                                    </div>
                                    <div className="text-[16px] font-bold text-[#005f9e] mb-1">Click to browse files</div>
                                    <div className="text-[14px] text-[#6a6976]">or drag and drop here</div>
                                 </>
                             )}
                          </div>
                      </div>
                  )}
               </>
          )}
      </div>

      {/* Render Dialogs */}
      <DefineCRSParametersDialog 
          isOpen={showDefineParamsDialog}
          onClose={() => setShowDefineParamsDialog(false)}
          onConfirm={handleCustomHorizontalDefined}
      />
      <UploadGridFileDialog
          isOpen={showUploadGridDialog}
          onClose={() => setShowUploadGridDialog(false)}
          onConfirm={handleCustomHorizontalDefined}
      />
    </>
  );
};

export default CombineCRSSelector;