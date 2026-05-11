import React from 'react';

interface BoundaryChipsProps {
  hasBoundaryPoints: boolean;
  hasProjectedCRS: boolean;
}

/**
 * BoundaryChips displays two indicator chips showing coordinate format status:
 * - φ,λ (phi,lambda): Geographic coordinates - primary (blue) when boundary points exist
 * - λE,N (Easting,Northing): Projected coordinates - primary (blue) when CRS is configured
 */
const BoundaryChips: React.FC<BoundaryChipsProps> = ({
  hasBoundaryPoints,
  hasProjectedCRS
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Geographic coordinates chip (φ,λ) */}
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold transition-colors ${
          hasBoundaryPoints
            ? 'bg-[#005f9e] text-white'
            : 'bg-[#eaeaef] text-[#6a6976] border border-[#d0d0d7]'
        }`}
        title={hasBoundaryPoints ? 'Geographic coordinates defined' : 'No geographic coordinates'}
      >
        φ,λ
      </span>
      
      {/* Projected coordinates chip (λE,N) */}
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold transition-colors ${
          hasProjectedCRS
            ? 'bg-[#005f9e] text-white'
            : 'bg-[#eaeaef] text-[#6a6976] border border-[#d0d0d7]'
        }`}
        title={hasProjectedCRS ? 'Projected coordinates available (Easting/Northing)' : 'No CRS configured for projected coordinates'}
      >
        λE,N
      </span>
    </div>
  );
};

export default BoundaryChips;
