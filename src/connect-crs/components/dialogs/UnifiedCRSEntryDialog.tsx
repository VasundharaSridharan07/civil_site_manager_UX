// @ts-nocheck
import React from 'react';
import { X, Globe, FileUp, RefreshCw, Wrench, HelpCircle } from "lucide-react";

interface CRSPathOption {
  id: 'published' | 'file' | 'field' | 'custom';
  title: string;
  description: string;
  bestFor: string;
  icon: React.ReactNode;
}

interface UnifiedCRSEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPath: (path: 'published' | 'file' | 'field' | 'custom') => void;
  hasProjectLocation?: boolean;
}

const CRS_PATH_OPTIONS: CRSPathOption[] = [
  {
    id: 'published',
    title: 'Published CRS',
    description: 'Select from registered Coordinate Reference systems in the Trimble Geodetic Library.',
    bestFor: 'Projects using a well known coordinate reference system.',
    icon: <Globe className="w-6 h-6" />
  },
  {
    id: 'file',
    title: 'Import from File',
    description: 'Upload .cal, .jxl, or .dc format files',
    bestFor: 'Getting CRS settings from an external source that have defined the Coordinate Reference System and exported it to a supported file format.',
    icon: <FileUp className="w-6 h-6" />
  },
  {
    id: 'field',
    title: 'Sync from integrated Application',
    description: 'Import CRS configuration from a field application',
    bestFor: 'Syncing CRS settings from an integrated application where the CRS settings have been defined or should be received.',
    icon: <RefreshCw className="w-6 h-6" />
  },
  {
    id: 'custom',
    title: 'Build Custom CRS',
    description: 'Set up a custom CRS by combining horizontal and vertical CRS - components, together with Local Site settings and calibration settings',
    bestFor: 'Projects that need special settings to reflect the site with correct precision.',
    icon: <Wrench className="w-6 h-6" />
  }
];

const UnifiedCRSEntryDialog: React.FC<UnifiedCRSEntryDialogProps> = ({
  isOpen,
  onClose,
  onSelectPath,
  hasProjectLocation = false
}) => {
  if (!isOpen) return null;

  const handleCardClick = (pathId: 'published' | 'file' | 'field' | 'custom') => {
    onClose();
    onSelectPath(pathId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[90vw] max-w-[1100px] max-h-[85vh] bg-[#f9f9fb] shadow-xl rounded-[2px] overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-[#d0d0d7]">
          <h2 className="text-[18px] font-bold text-[#363545] m-0">Configure coordinate reference system</h2>
          <button 
            onClick={onClose} 
            className="text-[#6a6976] hover:text-[#363545] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content - 2x2 Grid of Option Cards */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {CRS_PATH_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleCardClick(option.id)}
                className="text-left p-5 border rounded-[2px] transition-all group border-[#d0d0d7] bg-[#f3f3f7] hover:border-[#005f9e] hover:bg-white hover:shadow-sm"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded bg-[#eaeaef] border border-[#d0d0d7] flex items-center justify-center text-[#6a6976] mb-4">
                  {option.icon}
                </div>

                {/* Content */}
                <h3 className="text-[15px] font-bold text-[#363545] mb-1">
                  {option.title}
                </h3>
                <p className="text-[13px] text-[#6a6976] mb-3 leading-relaxed">
                  {option.description}
                </p>
                <p className="text-[12px] text-[#6a6976]">
                  <span className="font-semibold">Best for:</span> {option.bestFor}
                </p>
              </button>
            ))}
          </div>
          <button className="mt-4 flex items-center gap-2 text-[#6a6976] hover:text-[#005f9e] text-[13px] font-medium transition-colors">
            <HelpCircle className="w-4 h-4" />
            Need help deciding?
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCRSEntryDialog;
