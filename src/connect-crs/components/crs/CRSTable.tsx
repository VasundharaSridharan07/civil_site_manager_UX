import React from 'react';
import { ArrowUp, ArrowDown, Search } from "lucide-react";
import type { CRSItem } from '../../types';

interface CRSTableProps {
  items: CRSItem[];
  selectedItem: CRSItem | null;
  onSelect: (item: CRSItem) => void;
  sortConfig: { key: keyof CRSItem; direction: 'asc' | 'desc' } | null;
  onSort: (key: keyof CRSItem) => void;
  variant?: 'compound' | 'component' | 'horizontal' | 'vertical'; // compound: Name, Country, Unit, Code | component/horizontal/vertical: + LatLong, Type
  hiddenColumns?: string[]; // Array of keys to hide, e.g. ['latLong', 'type']
  emptyMessage?: React.ReactNode;
  /** When set (e.g. for TGR source), second column uses this label and getValue instead of "Country" / name-before-slash */
  secondColumn?: { label: string; getValue: (item: CRSItem) => string };
}

const defaultSecondColumnValue = (item: CRSItem): string =>
  (item.name && item.name.includes('/')) ? item.name.split('/')[0].trim() : '-';

const CRSTable: React.FC<CRSTableProps> = ({
  items,
  selectedItem,
  onSelect,
  sortConfig,
  onSort,
  variant = 'compound',
  hiddenColumns = [],
  emptyMessage,
  secondColumn
}) => {
  const secondColumnLabel = secondColumn?.label ?? 'Country';
  const getSecondColumnValue = secondColumn?.getValue ?? defaultSecondColumnValue;
  const renderSortArrow = (key: keyof CRSItem) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-[#005f9e]" /> : <ArrowDown className="w-3 h-3 text-[#005f9e]" />;
  };

  const HeaderCell = ({ label, sortKey, width, isFirst }: { label: string, sortKey: keyof CRSItem, width?: string, isFirst?: boolean }) => (
    <th 
      className={`py-3 text-[12px] font-semibold text-[#6a6976] border-b border-[#d0d0d7] cursor-pointer hover:bg-[#eaeaef] transition-colors group select-none ${isFirst ? 'pl-[2.5rem] pr-4' : 'px-4'} ${width ? `w-[${width}]` : ''}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {renderSortArrow(sortKey)}
      </div>
    </th>
  );

  const isComponentStyle =
    variant === 'component' || variant === 'horizontal' || variant === 'vertical';
  const showLatLong = isComponentStyle && !hiddenColumns.includes('latLong');
  const showType = isComponentStyle && !hiddenColumns.includes('type');

  // Calculate colSpan for empty message
  let colSpan = 4; // Name, Country, Unit, Code
  if (showLatLong) colSpan++;
  if (showType) colSpan++;

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#f9f9fb] sticky top-0 z-10 shadow-sm">
          <tr>
            <HeaderCell label="Name" sortKey="name" isFirst={true} />
            <HeaderCell label={secondColumnLabel} sortKey="name" width="140px" />
            
            {showLatLong && (
               <th className="py-3 px-4 text-[12px] font-semibold text-[#6a6976] border-b border-[#d0d0d7] w-[120px]">Lat/Long</th>
            )}
            
            {showType && (
               <th className="py-3 px-4 text-[12px] font-semibold text-[#6a6976] border-b border-[#d0d0d7] w-[120px]">Type</th>
            )}

            <HeaderCell label="Unit" sortKey="unit" width="120px" />
            <HeaderCell label="EPSG Code" sortKey="code" width="110px" />
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item) => {
              const isActive = selectedItem?.code === item.code;
              const nameWithoutCountry = (item.name && item.name.includes('/'))
                ? item.name.split('/').slice(1).join('/').trim()
                : (item.name || '');
              const displayName = [nameWithoutCountry, item.geoid || item.verticalDatum].filter(Boolean).join(' + ');
              return (
                <tr 
                  key={item.code} 
                  onClick={() => onSelect(item)}
                  className={`cursor-pointer transition-colors border-b border-[#f3f3f7] last:border-b-0 ${isActive ? 'bg-[#e5f0f8]' : 'hover:bg-[#f3f3f7]'}`}
                >
                  <td className={`py-3 pl-[2.5rem] pr-4 text-[13px] ${isActive ? 'text-[#005f9e] font-bold' : 'text-[#363545]'}`}>
                    {displayName || '-'}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-[#6a6976]">{getSecondColumnValue(item)}</td>
                  
                  {showLatLong && (
                    <td className="py-3 px-4 text-[13px] text-[#6a6976] whitespace-nowrap">{item.latLong || '-'}</td>
                  )}
                  
                  {showType && (
                    <td className="py-3 px-4 text-[13px] text-[#6a6976]">{item.type}</td>
                  )}

                  <td className="py-3 px-4 text-[13px] text-[#6a6976]">{item.unit}</td>
                  <td className={`py-3 px-4 text-[13px] ${isActive ? 'text-[#005f9e] font-bold' : 'text-[#363545]'}`}>{item.code}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={colSpan} className="py-12 pl-[2.5rem] pr-4 text-center">
                {emptyMessage ? (
                  typeof emptyMessage === 'string' ? (
                    emptyMessage === 'Set a project location to load published coordinate systems.' ||
                    emptyMessage === 'Start typing a name or code to search coordinate systems.' ? (
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Search className="w-8 h-8 text-[#6a6976] opacity-40" />
                        <p className="text-[#6a6976] text-[14px]">{emptyMessage}</p>
                      </div>
                    ) : (
                      <p className="text-[#6a6976] text-[14px]">{emptyMessage}</p>
                    )
                  ) : (
                    emptyMessage
                  )
                ) : (
                  <p className="text-[#6a6976] text-[14px]">No results found.</p>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CRSTable;