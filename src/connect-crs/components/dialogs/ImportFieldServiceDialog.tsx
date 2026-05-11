import React, { useState, useMemo } from 'react';
import { X, Search, ArrowLeft, ArrowRight, Check, MapPin } from "lucide-react";
import CRSConfirmationStep from '../crs/CRSConfirmationStep';
import ToggleSwitch from '../ToggleSwitch';

// Mock Data for demonstration with location info
const MOCK_JOBS = Array.from({ length: 50 }, (_, i) => ({
  id: `job-${i}`,
  name: i < 5 ? [
    "Site A - 2023-10-01",
    "Site B - Calibration",
    "Highway 99 Expansion",
    "Downtown Tower - Ph1",
    "Riverside Development"
  ][i] : `Field Job ${202300 + i} - ${['Survey', 'Grading', 'Paving', 'Utility'][i % 4]}`,
  application: i % 3 === 0 ? "Trimble Access" : i % 3 === 1 ? "Trimble Site Works" : "Trimble Earthworks",
  date: `2023-10-${(i % 28) + 1}`,
  crs: i % 2 === 0 ? "NAD83 / Colorado Central (ftUS)" : "WGS 84 / UTM zone 13N",
  horizontalName: i % 2 === 0 ? "NAD83(2011) / Colorado Central (ftUS)" : "WGS 84 / UTM zone 13N",
  horizontalCode: i % 2 === 0 ? "EPSG:6428" : "EPSG:32613",
  verticalName: i % 3 === 0 ? "NAVD88 height" : "EGM96 geoid height",
  verticalCode: i % 3 === 0 ? "EPSG:5703" : "EPSG:5773",
  site: i % 3 === 0 ? "Enabled" : "Disabled",
  location: {
    lat: 39.7392 + (Math.random() - 0.5) * 2,
    lng: -104.9903 + (Math.random() - 0.5) * 2
  },
  datum: i % 2 === 0 ? "NAD83 (2011)" : "WGS 84",
  verticalDatum: i % 3 === 0 ? "NAVD 88" : "EGM96",
  localSite: i % 3 === 0 ? {
    scaleFactor: "0.999984",
    projectHeight: "1540.250 m",
    northingOffset: "0.000 m",
    eastingOffset: "0.000 m"
  } : null
}));

interface ImportFieldServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onConfirm: (jobName: string) => void;
  onOpenImportSettings: () => void;
  projectLocation?: { lat: number; lng: number } | null;
  currentCRS?: {
    name: string;
    datum: string;
    verticalDatum: string;
    hasLocalSite: boolean;
  } | null;
}

// Calculate distance between two coordinates in km
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

type Step = 'select' | 'confirmation';

const ImportFieldServiceDialog: React.FC<ImportFieldServiceDialogProps> = ({ 
  isOpen, 
  onClose,
  onBack,
  onConfirm,
  projectLocation = null,
  currentCRS = null
}) => {
  const [step, setStep] = useState<Step>('select');
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByLocation, setFilterByLocation] = useState(true);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  // Filter and sort jobs - prioritize by location proximity
  const filteredJobs = useMemo(() => {
    let jobs = MOCK_JOBS.filter(job => 
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.application.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (projectLocation && filterByLocation) {
      jobs = jobs
        .map(job => ({
          ...job,
          distance: calculateDistance(projectLocation.lat, projectLocation.lng, job.location.lat, job.location.lng)
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    return jobs;
  }, [searchQuery, projectLocation, filterByLocation]);

  const selectedJob = MOCK_JOBS.find(j => j.id === selectedJobId);

  // Build confirmation info
  const previousCRSInfo = currentCRS ? {
    horizontalName: currentCRS.name.split('+')[0]?.trim() || currentCRS.name,
    horizontalCode: '',
    verticalName: currentCRS.name.split('+')[1]?.trim() || currentCRS.verticalDatum,
    verticalCode: ''
  } : null;

  const newCRSInfo = selectedJob ? {
    horizontalName: selectedJob.horizontalName,
    horizontalCode: selectedJob.horizontalCode,
    verticalName: selectedJob.verticalName,
    verticalCode: selectedJob.verticalCode,
    hasLocalSite: !!selectedJob.localSite
  } : { horizontalName: '', horizontalCode: '', verticalName: '', verticalCode: '' };

  // Calculate impacts
  const impacts = useMemo(() => {
    if (!currentCRS || !selectedJob) return [];
    const list = [];
    if (currentCRS.datum !== selectedJob.datum) {
      list.push({ message: 'Existing coordinates may shift position', severity: 'warning' as const });
      list.push({ message: 'Published data will need recalculation', severity: 'warning' as const });
    }
    if (currentCRS.verticalDatum !== selectedJob.verticalDatum) {
      list.push({ message: 'Elevation values may change', severity: 'warning' as const });
    }
    return list;
  }, [currentCRS, selectedJob]);

  const requiresConfirmation = !!currentCRS;
  const canConfirm = !requiresConfirmation || confirmationChecked;

  if (!isOpen) return null;

  const handleNext = () => {
    if (selectedJobId) setStep('confirmation');
  };

  const handleBack = () => {
    setStep('select');
    setConfirmationChecked(false);
  };

  const handleConfirm = () => {
    if (selectedJob) {
      onConfirm(selectedJob.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[45rem] max-h-[85vh] bg-white shadow-xl rounded-[2px] overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-[#d0d0d7] bg-white">
          <h2 className="text-[18px] font-bold text-[#363545] m-0">Configure coordinate reference system</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black"><X className="w-5 h-5" /></button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {step === 'select' ? (
            <div className="flex flex-col h-[500px]">
              <div className="p-6 pb-4 bg-white border-b border-[#d0d0d7]">
                <h3 className="text-[16px] font-bold text-[#363545] mb-2">Import from Field Service</h3>
                <p className="text-[14px] text-[#6a6976] mb-4">
                  Import and synchronize Coordinate Reference System configuration from a field application. Select a source below:
                </p>
                
                {/* Search and Filter Row */}
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Search jobs..." 
                      className="w-full pl-9 pr-4 py-2 border border-[#d0d0d7] rounded-[2px] text-[14px] text-[#363545] outline-none bg-white focus:border-[#005f9e]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#aeaeb6]" />
                  </div>
                  
                  {/* Location Filter Toggle */}
                  {projectLocation && (
                    <ToggleSwitch
                      checked={filterByLocation}
                      onChange={setFilterByLocation}
                      label={
                        <>
                          <MapPin className="w-4 h-4 text-[#6a6976] flex-shrink-0" />
                          Filter by project location
                        </>
                      }
                    />
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-white">
                <div className="divide-y divide-[#eaeaef]">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <div 
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        onDoubleClick={handleNext}
                        className={`px-6 py-3 cursor-pointer text-[14px] flex items-center justify-between transition-colors ${
                          selectedJobId === job.id 
                            ? 'bg-[#e5f0f8] border-l-2 border-l-[#005f9e]' 
                            : 'hover:bg-[#f9f9fb] border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`font-semibold ${selectedJobId === job.id ? 'text-[#005f9e]' : 'text-[#363545]'}`}>
                              {job.name}
                            </span>
                            <span className="text-[#d0d0d7]">-</span>
                            <span className="text-[13px] text-[#005f9e]">{job.application}</span>
                          </div>
                          <div className="text-[12px] text-[#6a6976] mt-0.5 flex items-center gap-3">
                            <span>{job.date}</span>
                            <span className="text-[#d0d0d7]">|</span>
                            <span>{job.crs}</span>
                            {job.localSite && (
                              <>
                                <span className="text-[#d0d0d7]">|</span>
                                <span className="text-[#5e9331]">Local Site</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 ml-4">
                          {'distance' in job && projectLocation && (
                            <span className="text-[11px] text-[#6a6976] bg-[#f3f3f7] px-2 py-0.5 rounded whitespace-nowrap">
                              {(job as typeof job & { distance: number }).distance < 1
                                ? `${((job as typeof job & { distance: number }).distance * 1000).toFixed(0)}m away`
                                : `${(job as typeof job & { distance: number }).distance.toFixed(1)}km away`
                              }
                            </span>
                          )}
                          {selectedJobId === job.id && <Check className="w-4 h-4 text-[#005f9e]" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-[#6a6976] text-[14px] italic">
                      No jobs found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
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
        </div>

        {/* Footer */}
        <footer className="flex justify-end items-center gap-3 px-6 py-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
          {step === 'select' && onBack && (
            <button 
              onClick={onBack} 
              className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step === 'confirmation' && (
            <button 
              onClick={handleBack} 
              className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#363545] bg-white border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          
          {step === 'select' ? (
            <button 
              onClick={handleNext}
              disabled={!selectedJobId}
              className={`flex items-center gap-2 text-white text-[14px] font-bold py-2 px-6 rounded-[2px] ${
                selectedJobId ? 'bg-[#005f9e] hover:bg-[#00437b]' : 'bg-[#aeb0b6] cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`text-white text-[14px] font-bold py-2 px-6 rounded-[2px] ${
                canConfirm ? 'bg-[#005f9e] hover:bg-[#00437b]' : 'bg-[#aeb0b6] cursor-not-allowed'
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

export default ImportFieldServiceDialog;
