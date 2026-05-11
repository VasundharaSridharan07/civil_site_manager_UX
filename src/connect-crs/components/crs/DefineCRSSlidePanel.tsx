import React, { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Upload } from 'lucide-react';

type CRSType = 'horizontal' | 'vertical';

interface DefineCRSParameters {
  systemName: string;
  projectionMethod: string;
  referenceDatum: string;
  centralMeridian: string;
  latitudeOfOrigin: string;
  gridFile?: File | null;
}

interface DefineCRSSlidePanelProps {
  isOpen: boolean;
  type: CRSType;
  onClose: () => void;
  onConfirm: (params: DefineCRSParameters) => void;
  initialValues?: Partial<DefineCRSParameters>;
}

const PROJECTION_METHODS = [
  'Transverse Mercator',
  'Lambert Conformal Conic (1SP)',
  'Lambert Conformal Conic (2SP)',
  'Oblique Mercator',
  'Stereographic',
  'Albers Equal Area',
  'Mercator'
];

const REFERENCE_DATUMS = [
  'NAD83(2011)',
  'NAD83(NSRS2007)',
  'NAD83(CORS96)',
  'NAD83',
  'WGS 84',
  'ETRS89',
  'GDA2020',
  'GDA94'
];

/**
 * DefineCRSSlidePanel is a slide-out panel for defining custom horizontal or vertical CRS parameters.
 * Based on D07AB design - includes System Name, Projection Method, Reference Datum, coordinates, and grid file upload.
 */
const DefineCRSSlidePanel: React.FC<DefineCRSSlidePanelProps> = ({
  isOpen,
  type,
  onClose,
  onConfirm,
  initialValues
}) => {
  const [values, setValues] = useState<DefineCRSParameters>({
    systemName: '',
    projectionMethod: '',
    referenceDatum: '',
    centralMeridian: '0.000',
    latitudeOfOrigin: '0.000',
    gridFile: null
  });

  const [editingField, setEditingField] = useState<'centralMeridian' | 'latitudeOfOrigin' | null>(null);

  // Reset values when panel opens
  useEffect(() => {
    if (isOpen) {
      setValues({
        systemName: initialValues?.systemName || '',
        projectionMethod: initialValues?.projectionMethod || '',
        referenceDatum: initialValues?.referenceDatum || '',
        centralMeridian: initialValues?.centralMeridian || '0.000',
        latitudeOfOrigin: initialValues?.latitudeOfOrigin || '0.000',
        gridFile: null
      });
      setEditingField(null);
    }
  }, [isOpen, initialValues]);

  const handleChange = (field: keyof DefineCRSParameters, value: string | File | null) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleChange('gridFile', file);
  };

  const handleSubmit = () => {
    onConfirm(values);
  };

  const isValid = values.systemName.trim() !== '' && 
                  values.projectionMethod !== '' && 
                  values.referenceDatum !== '';

  if (!isOpen) return null;

  const title = type === 'horizontal' ? 'Define Horizontal CRS' : 'Define Vertical CRS';
  const description = type === 'horizontal' 
    ? 'add information here about adjusting the local settings'
    : 'add information here about vertical datum settings';

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      
      {/* Slide Panel */}
      <div className="relative w-[360px] h-full bg-white shadow-xl flex flex-col animate-slideInLeft">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b border-[#d0d0d7]">
          <button 
            onClick={onClose}
            className="p-1 text-[#6a6976] hover:text-[#363545] hover:bg-[#f3f3f7] rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-[16px] font-bold text-[#363545]">{title}</h2>
            <p className="text-[12px] text-[#6a6976]">{description}</p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* System Name */}
          <div>
            <label className="block text-[13px] font-medium text-[#363545] mb-1.5">
              System Name
            </label>
            <input
              type="text"
              value={values.systemName}
              onChange={(e) => handleChange('systemName', e.target.value)}
              placeholder="Enter name"
              className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] placeholder-[#aeaeb6] focus:outline-none focus:border-[#005f9e]"
            />
          </div>

          {/* Projection Method */}
          <div>
            <label className="block text-[13px] font-medium text-[#363545] mb-1.5">
              Projection Method
            </label>
            <div className="relative">
              <select
                value={values.projectionMethod}
                onChange={(e) => handleChange('projectionMethod', e.target.value)}
                className="w-full appearance-none bg-white border border-[#d0d0d7] rounded-[2px] px-3 py-2 pr-8 text-[14px] text-[#363545] focus:outline-none focus:border-[#005f9e]"
              >
                <option value="">Select</option>
                {PROJECTION_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-[#6a6976]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Reference Datum */}
          <div>
            <label className="block text-[13px] font-medium text-[#363545] mb-1.5">
              Reference Datum
            </label>
            <div className="relative">
              <select
                value={values.referenceDatum}
                onChange={(e) => handleChange('referenceDatum', e.target.value)}
                className="w-full appearance-none bg-white border border-[#d0d0d7] rounded-[2px] px-3 py-2 pr-8 text-[14px] text-[#363545] focus:outline-none focus:border-[#005f9e]"
              >
                <option value="">Select</option>
                {REFERENCE_DATUMS.map(datum => (
                  <option key={datum} value={datum}>{datum}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-[#6a6976]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Central Meridian */}
          <div>
            <label className="block text-[13px] font-medium text-[#363545] mb-1.5">
              Central Meridian
            </label>
            <div className="relative">
              {editingField === 'centralMeridian' ? (
                <input
                  type="text"
                  value={values.centralMeridian}
                  onChange={(e) => handleChange('centralMeridian', e.target.value)}
                  onBlur={() => setEditingField(null)}
                  autoFocus
                  className="w-full border border-[#005f9e] rounded-[2px] px-3 py-2 pr-10 text-[14px] text-[#363545] focus:outline-none"
                />
              ) : (
                <div 
                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 pr-10 text-[14px] text-[#363545] bg-[#f9f9fb] cursor-pointer hover:border-[#aeaeb6]"
                  onClick={() => setEditingField('centralMeridian')}
                >
                  {values.centralMeridian}
                </div>
              )}
              <button
                onClick={() => setEditingField('centralMeridian')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6a6976] hover:text-[#005f9e]"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Latitude of Origin */}
          <div>
            <label className="block text-[13px] font-medium text-[#363545] mb-1.5">
              Latitude of Origin
            </label>
            <div className="relative">
              {editingField === 'latitudeOfOrigin' ? (
                <input
                  type="text"
                  value={values.latitudeOfOrigin}
                  onChange={(e) => handleChange('latitudeOfOrigin', e.target.value)}
                  onBlur={() => setEditingField(null)}
                  autoFocus
                  className="w-full border border-[#005f9e] rounded-[2px] px-3 py-2 pr-10 text-[14px] text-[#363545] focus:outline-none"
                />
              ) : (
                <div 
                  className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 pr-10 text-[14px] text-[#363545] bg-[#f9f9fb] cursor-pointer hover:border-[#aeaeb6]"
                  onClick={() => setEditingField('latitudeOfOrigin')}
                >
                  {values.latitudeOfOrigin}
                </div>
              )}
              <button
                onClick={() => setEditingField('latitudeOfOrigin')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6a6976] hover:text-[#005f9e]"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upload Grid File Section */}
          <div className="pt-4 border-t border-[#eaeaef]">
            <div className="bg-[#f3f3f7] border border-[#d0d0d7] rounded-[4px] p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#eaeaef] border border-[#d0d0d7] rounded flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-[#6a6976]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[13px] font-bold text-[#363545] mb-1">Upload Grid file</h4>
                  <p className="text-[12px] text-[#6a6976] mb-2">
                    Upload a Datum Grid File (DGF) or Shift Grid File (SGF) to define the horizontal transformation.
                  </p>
                  {values.gridFile ? (
                    <div className="flex items-center gap-2 text-[12px] text-[#005f9e]">
                      <span>{values.gridFile.name}</span>
                      <button 
                        onClick={() => handleChange('gridFile', null)}
                        className="text-[#a51d25] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="inline-block text-[12px] text-[#005f9e] hover:underline cursor-pointer">
                      Select file...
                      <input
                        type="file"
                        accept=".dgf,.sgf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-3 p-4 border-t border-[#d0d0d7] bg-[#f9f9fb]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[14px] font-semibold text-[#363545] hover:bg-[#eaeaef] rounded-[2px] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`px-5 py-2 text-[14px] font-bold text-white rounded-[2px] transition-colors ${
              isValid 
                ? 'bg-[#005f9e] hover:bg-[#00437b]' 
                : 'bg-[#d0d0d7] cursor-not-allowed'
            }`}
          >
            Ok
          </button>
        </footer>
      </div>

      {/* CSS for animation */}
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DefineCRSSlidePanel;
