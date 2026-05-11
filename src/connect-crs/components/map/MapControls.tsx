import React, { useState, useRef, useEffect } from 'react';
import { Layers, Plus, Minus, Search, Loader2 } from "lucide-react";

interface MapControlsProps {
  mapType: string;
  setMapType: (type: string) => void;
  onZoom: (delta: number) => void;
  onSearch: (lat: number, lng: number, boundingBox?: [number, number, number, number]) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  mapType,
  setMapType,
  onZoom,
  onSearch
}) => {
  const [mapTypeDropdownOpen, setMapTypeDropdownOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Refs for click outside detection
  const mapTypeRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mapTypeRef.current && !mapTypeRef.current.contains(event.target as Node)) {
        setMapTypeDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultSelect = (result: any) => {
    let bbox: [number, number, number, number] | undefined = undefined;
    
    // Nominatim returns [minlat, maxlat, minlon, maxlon] as strings
    if (result.boundingbox && Array.isArray(result.boundingbox) && result.boundingbox.length === 4) {
      bbox = [
        parseFloat(result.boundingbox[0]),
        parseFloat(result.boundingbox[1]),
        parseFloat(result.boundingbox[2]),
        parseFloat(result.boundingbox[3])
      ];
    }

    onSearch(parseFloat(result.lat), parseFloat(result.lon), bbox);
    setSearchQuery(result.display_name); // Update input to selected name
    setShowResults(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setShowResults(false);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        if (data.length === 1) {
          // If only one result, select it automatically
          handleResultSelect(data[0]);
        } else {
          // If multiple results, show the list
          setSearchResults(data);
          setShowResults(true);
        }
      } else {
        setSearchError("Location not found");
      }
    } catch (err) {
      setSearchError("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const getLayerButtonClass = (type: string) => {
    const isActive = mapType === type;
    return `text-left px-4 py-2 text-[13px] ${isActive ? 'bg-[#e5f0f8] text-[#005f9e] font-semibold' : 'hover:bg-[#eaeaef] text-[#363545]'}`;
  };

  return (
    <>
      {/* Layer Switcher */}
      <div className="absolute top-3 left-3 z-20" ref={mapTypeRef}>
        <div className="relative">
            <button onClick={() => setMapTypeDropdownOpen(!mapTypeDropdownOpen)} className={`bg-white border border-[#d0d0d7] p-2 rounded-[2px] shadow-sm hover:bg-[#f3f3f7] ${mapTypeDropdownOpen ? 'bg-[#f3f3f7]' : ''}`} title="Change map layer">
              <Layers className="w-5 h-5 text-[#363545]" />
            </button>
            {mapTypeDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-[#d0d0d7] shadow-lg rounded-[2px] z-20 flex flex-col min-w-[120px]">
                  <button onClick={() => { setMapType('m'); setMapTypeDropdownOpen(false); }} className={getLayerButtonClass('m')}>Road Map</button>
                  <button onClick={() => { setMapType('s'); setMapTypeDropdownOpen(false); }} className={getLayerButtonClass('s')}>Satellite</button>
                  <button onClick={() => { setMapType('y'); setMapTypeDropdownOpen(false); }} className={getLayerButtonClass('y')}>Hybrid</button>
                  <button onClick={() => { setMapType('p'); setMapTypeDropdownOpen(false); }} className={getLayerButtonClass('p')}>Terrain</button>
              </div>
            )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="absolute top-3 left-[60px] right-[60px] max-w-sm z-20" ref={searchContainerRef}>
        <form onSubmit={handleSearch} className="relative shadow-sm">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search location..." 
              className="w-full h-[38px] pl-3 pr-10 border border-[#d0d0d7] rounded-[2px] text-[13px] text-[#363545] outline-none focus:border-[#005f9e] bg-white/90 focus:bg-white transition-colors caret-[#005f9e]" 
            />
            <button type="submit" className="absolute right-0 top-0 h-full px-3 text-[#6a6976] hover:text-[#005f9e]">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
        </form>
        
        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d0d0d7] shadow-lg rounded-[2px] max-h-60 overflow-y-auto z-30">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleResultSelect(result)}
                className="w-full text-left px-3 py-2 text-[13px] text-[#363545] hover:bg-[#e5f0f8] border-b border-[#f3f3f7] last:border-b-0"
              >
                <div className="truncate font-medium">{result.display_name.split(',')[0]}</div>
                <div className="truncate text-[11px] text-[#6a6976]">{result.display_name}</div>
              </button>
            ))}
          </div>
        )}

        {searchError && <div className="absolute top-full left-0 mt-1 text-[11px] text-red-600 bg-white px-2 py-1 rounded shadow-sm border border-red-200">{searchError}</div>}
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 shadow-sm z-20">
        <button onClick={() => onZoom(1)} className="bg-white w-8 h-8 flex items-center justify-center border border-[#d0d0d7] rounded-t-[2px] hover:bg-[#f3f3f7] text-[#363545]"><Plus className="w-5 h-5" /></button>
        <button onClick={() => onZoom(-1)} className="bg-white w-8 h-8 flex items-center justify-center border-l border-r border-b border-[#d0d0d7] rounded-b-[2px] hover:bg-[#f3f3f7] text-[#363545]"><Minus className="w-5 h-5" /></button>
      </div>

      {/* North Arrow */}
      <div className="absolute bottom-6 right-3 pointer-events-none z-20">
        <div className="w-10 h-10 bg-white border border-[#d0d0d7] rounded-full shadow-sm flex items-center justify-center">
            <div className="relative w-6 h-6">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M12 2L15 11H9L12 2Z" fill="#a51d25" />
                    <path d="M12 22L9 13H15L12 22Z" fill="#aeaeb6" />
                </svg>
            </div>
        </div>
      </div>
    </>
  );
};

export default MapControls;