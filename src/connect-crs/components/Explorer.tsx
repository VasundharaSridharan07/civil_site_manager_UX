import React from 'react';
import { 
  Folder, 
  FileText, 
  Image, 
  Box, 
  File,
  LayoutGrid,
  List,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { FileType } from '../types';
import type { FileSystemItem, BreadcrumbItem, SelectionState } from '../types';

interface ExplorerProps {
  items: FileSystemItem[];
  currentPath: BreadcrumbItem[];
  selection: SelectionState;
  onNavigate: (id: string | null) => void;
  onSelect: (id: string, multi: boolean) => void;
  onSelectAll: (ids: string[]) => void;
}

const Explorer: React.FC<ExplorerProps> = ({ 
  items, 
  currentPath, 
  selection, 
  onNavigate, 
  onSelect,
  onSelectAll
}) => {
  
  const getIcon = (type: FileType) => {
    switch (type) {
      case FileType.FOLDER: return <Folder className="w-5 h-5 text-[#363545] fill-[#363545]/10" />;
      case FileType.FILE: return <FileText className="w-5 h-5 text-[#363545]" />;
      case FileType.IMAGE: return <Image className="w-5 h-5 text-[#363545]" />;
      case FileType.MODEL: return <Box className="w-5 h-5 text-[#363545]" />;
      default: return <File className="w-5 h-5 text-[#363545]" />;
    }
  };

  const handleRowClick = (e: React.MouseEvent, item: FileSystemItem) => {
    // Check if clicking specific interactive elements like checkbox
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]')) {
      return; // Handled by checkbox change
    }
    
    // If folder, navigate
    if (item.type === FileType.FOLDER) {
      onNavigate(item.id);
    } else {
      // If file, select it (exclusive selection logic usually, but here we just select)
      onSelect(item.id, false);
    }
  };

  const handleCheckboxChange = (id: string, _checked: boolean) => {
    onSelect(id, true);
  };

  const allSelected = items.length > 0 && items.every(item => selection.has(item.id));

  return (
    <div className="flex flex-col h-full bg-[#f3f3f7]">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#d0d0d7]">
        <div className="flex flex-col">
           {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-[13px] text-[#6a6976] mb-1">
             <button 
                onClick={() => onNavigate(null)}
                className="hover:underline hover:text-[#005f9e]"
             >
                Data
             </button>
             {currentPath.map((crumb, index) => {
                const isLast = index === currentPath.length - 1;
                return (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight className="w-3 h-3 text-[#aeaeb6]" />
                    {isLast ? (
                       <span className="font-semibold text-[#363545] cursor-default">{crumb.name}</span>
                    ) : (
                      <button 
                        onClick={() => onNavigate(crumb.id)}
                        className="hover:underline hover:text-[#005f9e]"
                      >
                        {crumb.name}
                      </button>
                    )}
                  </React.Fragment>
                );
             })}
          </div>
          <h1 className="text-[20px] text-[#363545]">Explorer</h1>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
           <div className="flex bg-[#eaeaef] rounded-[2px] p-0.5">
              <button className="p-1.5 hover:bg-white rounded-[2px] text-[#363545]">
                 <LayoutGrid className="w-4 h-4" />
              </button>
              <button className="p-1.5 bg-white shadow-sm rounded-[2px] text-[#005f9e]">
                 <List className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-white rounded-[2px] text-[#363545]">
                 <Box className="w-4 h-4" />
              </button>
           </div>
           <button className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#363545]">
              <MoreVertical className="w-5 h-5" />
           </button>
           <button className="bg-[#005f9e] hover:bg-[#00437b] text-white text-[14px] font-semibold py-1.5 px-4 rounded-[2px]">
              Add
           </button>
        </div>
      </div>

      {/* Grid / Table Header */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white border border-[#d0d0d7] rounded-[2px] shadow-sm min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-[40px_minmax(200px,1fr)_150px_150px_100px_100px] gap-4 px-4 h-[3.5rem] bg-[#f9f9fb] border-b border-[#d0d0d7] items-center text-[13px] font-semibold text-[#6a6976]">
            <div className="flex justify-center">
              <input 
                type="checkbox" 
                checked={allSelected}
                onChange={() => onSelectAll(items.map(i => i.id))}
                className="w-4 h-4 rounded-[2px] border-[#d0d0d7] text-[#005f9e] focus:ring-[#005f9e]"
              />
            </div>
            <div className="cursor-pointer hover:text-[#363545]">Name</div>
            <div className="cursor-pointer hover:text-[#363545]">Modified by</div>
            <div className="cursor-pointer hover:text-[#363545]">Modified on</div>
            <div className="cursor-pointer hover:text-[#363545]">Size</div>
            <div className="cursor-pointer hover:text-[#363545]">Version</div>
          </div>

          {/* Table Rows */}
          {items.map((item) => {
             const isSelected = selection.has(item.id);
             return (
              <div 
                key={item.id}
                onClick={(e) => handleRowClick(e, item)}
                className={`grid grid-cols-[40px_minmax(200px,1fr)_150px_150px_100px_100px] gap-4 px-4 h-[4rem] border-b border-[#d0d0d7] items-center text-[14px] text-[#363545] cursor-pointer transition-colors
                  ${isSelected ? 'bg-[#e5f0f8] text-[#005f9e]' : 'hover:bg-[#eaeaef] bg-white'}
                `}
              >
                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                    className="w-4 h-4 rounded-[2px] border-[#d0d0d7] text-[#005f9e] focus:ring-[#005f9e]"
                  />
                </div>
                <div className="flex items-center gap-3 font-medium truncate">
                   {getIcon(item.type)}
                   <span className="truncate">{item.name}</span>
                </div>
                <div className="truncate text-[#6a6976]">{item.modifiedBy}</div>
                <div className="truncate text-[#6a6976]">{item.modifiedOn}</div>
                <div className="truncate text-[#6a6976]">{item.size || '-'}</div>
                <div className="truncate text-[#6a6976]">{item.version}</div>
              </div>
             );
          })}
          
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[#6a6976]">
              <Folder className="w-12 h-12 mb-4 opacity-20" />
              <p>This folder is empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explorer;