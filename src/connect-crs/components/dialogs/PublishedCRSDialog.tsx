import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { fetchCRSData } from '../../data/crsData';
import type { CRSItem } from '../../data/crsData';
import {
  fetchPublishedCRS,
  getPublishedCrsSource,
  isPublishedCrsSourceSearchable,
} from '../../api/publishedCrsSource';
import { clearTgrCrsCache } from '../../api/tgrCrsData';
import { useCRSFilter } from '../../hooks/useCRSFilter';
import CRSFilterBar from '../crs/CRSFilterBar';
import CRSTable from '../crs/CRSTable';
import CRSConfirmationStep from '../crs/CRSConfirmationStep';

interface PublishedCRSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onConfirm: (item: CRSItem) => void;
  viewState: { lat: number, lng: number, zoom?: number };
  serverLocation?: string;
  searchMarker: { lat: number, lng: number } | null;
  projectLocation: { name: string; lat: number; lng: number } | null;
  boundaryPoints: { lat: number, lng: number }[];
  currentCRS?: CRSItem | null;
}

type Step = 'choose' | 'confirm';

const PublishedCRSDialog: React.FC<PublishedCRSDialogProps> = ({
  isOpen,
  onClose,
  onBack,
  onConfirm,
  serverLocation = "Europe",
  searchMarker,
  projectLocation,
  boundaryPoints,
  currentCRS = null,
}) => {
  const [step, setStep] = useState<Step>('choose');
  const [crsData, setCrsData] = useState<CRSItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [crsSearchInput, setCrsSearchInput] = useState("");
  const [crsSearchQuery, setCrsSearchQuery] = useState("");
  const [maxSearchResults, setMaxSearchResults] = useState(8);
  const [filterCRSByLocation, setFilterCRSByLocation] = useState(true);
  const [crsUnitFilter, setCrsUnitFilter] = useState<string>("All");
  
  const [selectedPublishedCRS, setSelectedPublishedCRS] = useState<CRSItem | null>(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  /** Bumps when header TGR/CSD changes so we refetch with the correct source */
  const [publishedCrsSourceVersion, setPublishedCrsSourceVersion] = useState(0);

  useEffect(() => {
    const onSourceChange = () => {
      clearTgrCrsCache();
      setPublishedCrsSourceVersion((v) => v + 1);
    };
    window.addEventListener('publishedCrsSourceChange', onSourceChange);
    return () => window.removeEventListener('publishedCrsSourceChange', onSourceChange);
  }, []);

  // Location for API proximity: searchMarker first, else projectLocation, else centre of boundaryPoints
  const location = useMemo(() => {
    if (searchMarker) return searchMarker;
    if (projectLocation) return { lat: projectLocation.lat, lng: projectLocation.lng };
    if (boundaryPoints.length > 0) {
      const lat = boundaryPoints.reduce((sum, p) => sum + p.lat, 0) / boundaryPoints.length;
      const lng = boundaryPoints.reduce((sum, p) => sum + p.lng, 0) / boundaryPoints.length;
      return { lat, lng };
    }
    return null;
  }, [searchMarker, projectLocation, boundaryPoints]);

  const hasLocation = !!location;

  const fetchData = useCallback(() => {
    if (!isOpen) return;
    if (isPublishedCrsSourceSearchable()) {
      setIsLoading(true);
      setLoadError(null);
      if (location) {
        const opts = { proximityLatitude: location.lat, proximityLongitude: location.lng };
        fetchPublishedCRS(opts)
          .then(data => {
            setCrsData(data);
            setLoadError(null);
          })
          .catch(err => {
            setLoadError(err?.message ?? 'Failed to load coordinate systems.');
            setCrsData([]);
          })
          .finally(() => setIsLoading(false));
      } else {
        fetchPublishedCRS()
          .then(apiData => {
            if (apiData.length > 0) {
              setCrsData(apiData);
              setLoadError(null);
              return;
            }
            return fetchCRSData().then(staticData => {
              setCrsData(staticData);
              setLoadError(null);
            });
          })
          .catch(() => {
            return fetchCRSData()
              .then(staticData => {
                setCrsData(staticData);
                setLoadError(null);
              })
              .catch(() => {
                setLoadError('Failed to load coordinate systems.');
                setCrsData([]);
              });
          })
          .finally(() => setIsLoading(false));
      }
    } else {
      setIsLoading(true);
      setLoadError(null);
      fetchCRSData()
        .then(data => {
          setCrsData(data);
          setLoadError(null);
        })
        .catch(() => {
          setLoadError('Failed to load coordinate systems.');
          setCrsData([]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, location?.lat, location?.lng, publishedCrsSourceVersion]);

  useEffect(() => {
    if (isOpen) {
      setStep('choose');
      setCrsSearchInput("");
      setCrsSearchQuery("");
      setMaxSearchResults(8);
      setSelectedPublishedCRS(null);
      setConfirmationChecked(false);
      // When API is configured we always use spatial filter (no toggle); otherwise default to location when available
      const hasLoc = !!(searchMarker || projectLocation || boundaryPoints.length > 0);
      setFilterCRSByLocation(isPublishedCrsSourceSearchable() ? true : hasLoc);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const compoundFilter = useCallback((item: CRSItem) => {
    return item.type === 'Compound';
  }, []);

  const customFilter = useCallback((item: CRSItem) => {
    if (getPublishedCrsSource() === 'TGR') return compoundFilter(item);
    if (isPublishedCrsSourceSearchable()) return true;
    return compoundFilter(item);
  }, [compoundFilter]);

  const isManualSearchMode = !hasLocation && isPublishedCrsSourceSearchable();

  const handleSearchSubmit = useCallback(() => {
    setCrsSearchQuery(crsSearchInput);
    setMaxSearchResults(8);
    setSelectedPublishedCRS(null);
  }, [crsSearchInput]);

  // In no-location mode, auto-run search shortly after typing stops.
  useEffect(() => {
    if (!isManualSearchMode) {
      setCrsSearchQuery(crsSearchInput);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (crsSearchInput !== crsSearchQuery) {
        setCrsSearchQuery(crsSearchInput);
        setMaxSearchResults(8);
        setSelectedPublishedCRS(null);
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [isManualSearchMode, crsSearchInput, crsSearchQuery]);

  // When API is searchable it already returns proximity-ordered results; do not apply client-side spatial filtering.
  // For static/CSD source, respect location toggle.
  const effectiveFilterByLocation = isPublishedCrsSourceSearchable()
    ? false
    : filterCRSByLocation;

  const { filteredAndSortedItems, sortConfig, handleSort } = useCRSFilter({
    data: crsData,
    searchQuery: crsSearchQuery,
    location,
    serverLocation,
    filterByLocation: effectiveFilterByLocation,
    unitFilter: crsUnitFilter,
    customFilter,
    minResults: 3
  });

  const isSearchDebouncing =
    isManualSearchMode && crsSearchInput.trim() !== crsSearchQuery.trim();
  const hasCommittedSearch = crsSearchQuery.trim().length > 0;
  const canShowSearchResults = !isManualSearchMode || hasCommittedSearch;

  const displayItems =
    !canShowSearchResults
      ? []
      : filteredAndSortedItems.slice(0, isManualSearchMode ? maxSearchResults : 100);

  const canShowMore =
    isManualSearchMode &&
    hasCommittedSearch &&
    filteredAndSortedItems.length > displayItems.length;

  const handleSelect = (item: CRSItem) => {
    setSelectedPublishedCRS(item);
  };

  const handleNext = () => {
    if (step === 'choose' && selectedPublishedCRS) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('choose');
    }
  };

  const handleConfirm = () => {
    if (!selectedPublishedCRS) return;
    onConfirm(selectedPublishedCRS);
  };

  const requiresConfirmation = !!currentCRS;

  const previousCRSInfo = currentCRS ? {
    horizontalName: currentCRS.horizontalComponent || currentCRS.name.split('+')[0]?.trim(),
    horizontalCode: currentCRS.horizontalCode || currentCRS.code,
    verticalName: currentCRS.verticalComponent || currentCRS.name.split('+')[1]?.trim(),
    verticalCode: currentCRS.verticalCode
  } : null;

  const newCRSInfo = selectedPublishedCRS ? {
    horizontalName: selectedPublishedCRS.horizontalComponent || selectedPublishedCRS.name.split('+')[0]?.trim(),
    horizontalCode: selectedPublishedCRS.horizontalCode || selectedPublishedCRS.code,
    verticalName: selectedPublishedCRS.verticalComponent || selectedPublishedCRS.name.split('+')[1]?.trim(),
    verticalCode: selectedPublishedCRS.verticalCode
  } : { horizontalName: '', horizontalCode: '', verticalName: '', verticalCode: '' };

  const impacts = useMemo(() => {
    if (!currentCRS) return [];
    const list = [];
    if (currentCRS.datum !== selectedPublishedCRS?.datum) {
      list.push({ message: 'Existing coordinates may shift position', severity: 'warning' as const });
      list.push({ message: 'Published data will need recalculation', severity: 'warning' as const });
    }
    if (currentCRS.verticalDatum !== selectedPublishedCRS?.verticalDatum) {
      list.push({ message: 'Elevation values may change', severity: 'warning' as const });
    }
    return list;
  }, [currentCRS, selectedPublishedCRS]);

  if (!isOpen) return null;

  const canProceedFromChoose = !!selectedPublishedCRS;
  const canConfirm = !requiresConfirmation || confirmationChecked;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[90vw] h-[85vh] max-w-[1100px] bg-[#f9f9fb] shadow-xl rounded-[2px] overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-[#d0d0d7]">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-[18px] font-bold text-[#363545] m-0">Configure coordinate reference system</h2>
            <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-[#005f9e] animate-spin mb-2" />
              <p className="text-[14px] text-[#6a6976]">Loading coordinate systems...</p>
            </div>
          ) : (
            <>
              {step === 'choose' && (
                <>
                  <div className="px-[2.5rem] py-6 bg-white border-b border-[#d0d0d7]">
                    <h3 className="text-[16px] font-bold text-[#363545] mb-2">Choose published coordinate reference system</h3>
                    <p className="text-[14px] text-[#6a6976] mb-6">
                      Select a published Compound CRS from the list below. A Compound CRS consist of a Horizontal CRS + Vertical CRS.
                    </p>
                    
                    {loadError && (
                      <div className="mb-4 p-4 bg-[#fef2f2] border border-[#fecaca] rounded-[2px] flex items-center justify-between gap-4">
                        <p className="text-[14px] text-[#a51d25]">{loadError}</p>
                        <button
                          type="button"
                          onClick={fetchData}
                          className="flex-shrink-0 px-4 py-2 text-[14px] font-semibold text-white bg-[#005f9e] hover:bg-[#00437b] rounded-[2px] transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    
                    <CRSFilterBar 
                      searchQuery={crsSearchInput}
                      onSearchChange={setCrsSearchInput}
                      onSearchSubmit={handleSearchSubmit}
                      searchPlaceholder={isManualSearchMode ? "Type name or EPSG code..." : undefined}
                      hasLocation={hasLocation}
                      filterByLocation={effectiveFilterByLocation}
                      onLocationFilterToggle={setFilterCRSByLocation}
                      hideLocationFilter={isPublishedCrsSourceSearchable()}
                      unitFilter={crsUnitFilter}
                      onUnitFilterChange={setCrsUnitFilter}
                      layout="buttons-right"
                    />
                    {isManualSearchMode && (
                      <p className="mt-3 text-[12px] text-[#6a6976]">
                        {hasCommittedSearch && filteredAndSortedItems.length > 0
                          ? `Showing ${displayItems.length} of ${filteredAndSortedItems.length} result${filteredAndSortedItems.length === 1 ? '' : 's'}${crsSearchQuery ? ` for "${crsSearchQuery}"` : ''}`
                          : 'Results update automatically after you stop typing. Press Enter to search immediately.'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    <CRSTable
                      items={displayItems}
                      selectedItem={selectedPublishedCRS}
                      onSelect={handleSelect}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      secondColumn={getPublishedCrsSource() === 'TGR' ? { label: 'Datum', getValue: (item) => item.datum ?? ((item.name && item.name.includes('/')) ? item.name.split('/')[0].trim() : '-') } : undefined}
                      emptyMessage={
                        isManualSearchMode
                          ? isSearchDebouncing && crsSearchInput.trim().length > 0
                            ? (
                                <div className="flex items-center justify-center py-2">
                                  <Loader2 className="w-8 h-8 text-[#005f9e] animate-spin" />
                                </div>
                              )
                            : hasCommittedSearch
                              ? 'No results found matching your search.'
                              : 'Start typing a name or code to search coordinate systems.'
                          : crsSearchQuery
                            ? 'No results found matching your search.'
                            : effectiveFilterByLocation
                              ? 'No coordinate systems found for this location.'
                              : 'No official compound coordinate systems found for this region.'
                      }
                    />
                    {canShowMore && (
                      <div className="px-[2.5rem] py-3 border-t border-[#f3f3f7]">
                        <button
                          type="button"
                          onClick={() => setMaxSearchResults(filteredAndSortedItems.length)}
                          className="text-[13px] font-semibold text-[#005f9e] hover:text-[#00437b] transition-colors"
                        >
                          Show all {filteredAndSortedItems.length} results
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 'confirm' && selectedPublishedCRS && (
                <div className="flex-1 overflow-y-auto bg-white">
                  <CRSConfirmationStep
                    previousCRS={previousCRSInfo}
                    newCRS={newCRSInfo}
                    impacts={impacts}
                    requiresConfirmation={requiresConfirmation}
                    isConfirmed={confirmationChecked}
                    onConfirmChange={setConfirmationChecked}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-end items-center gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
          {step === 'choose' && onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step === 'choose' && !onBack && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
            >
              Cancel
            </button>
          )}
          {step === 'confirm' && (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          
          {step === 'choose' ? (
            <button 
              onClick={handleNext}
              disabled={!canProceedFromChoose}
              className={`flex items-center gap-2 text-white text-[14px] font-bold py-2 px-6 rounded-[2px] transition-colors ${
                canProceedFromChoose
                  ? 'bg-[#005f9e] hover:bg-[#00437b]' 
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`text-white text-[14px] font-bold py-2 px-6 rounded-[2px] transition-colors ${
                canConfirm
                  ? 'bg-[#005f9e] hover:bg-[#00437b]' 
                  : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Apply changes
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default PublishedCRSDialog;
