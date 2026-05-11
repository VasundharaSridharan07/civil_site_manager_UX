import React from 'react';
import { 
  X, 
  Pencil, 
  UserCog, 
  Download, 
  Move, 
  Trash2, 
  MoreVertical, 
  MessageCircle, 
  Key,
  Users,
  Box,
  FileText,
  Folder
} from "lucide-react";
import { FileType } from '../types';
import type { FileSystemItem, SelectionState } from '../types';

interface RightPanelProps {
  selection: SelectionState;
  allItems: FileSystemItem[];
  onClose: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ selection, allItems, onClose }) => {
  if (selection.size === 0) return null;

  // Derive selected objects
  const selectedItems = allItems.filter(item => selection.has(item.id));
  const count = selectedItems.length;

  // --- MULTI SELECT PANEL ---
  if (count > 1) {
    return (
      <aside className="w-[316px] bg-white border-l border-[#d0d0d7] flex flex-col shadow-[-2px_0_8px_rgba(0,0,0,0.15)] z-20 transition-all duration-300">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#d0d0d7]">
          <span className="text-[14px] font-bold text-[#363545] uppercase">{count} SELECTED ITEMS</span>
          <button onClick={onClose} className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#363545]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          
          {/* 3D Viewer Button */}
          <button className="w-full bg-[#363545] hover:bg-black text-white text-[14px] font-semibold py-3 px-4 rounded-[2px] flex items-center justify-center gap-2">
            <Box className="w-5 h-5" />
            View in 3D viewer
          </button>

          {/* Bulk Actions */}
          <div className="flex flex-col gap-2">
            <div className="h-px bg-[#d0d0d7] my-2"></div>
            
            <button className="flex items-center gap-3 py-2 text-[#005f9e] hover:underline text-[14px]">
              <Key className="w-5 h-5" />
              <span>Permissions</span>
            </button>
            <button className="flex items-center gap-3 py-2 text-[#005f9e] hover:underline text-[14px]">
              <Users className="w-5 h-5" />
              <span>Share</span>
            </button>
            <button className="flex items-center gap-3 py-2 text-[#005f9e] hover:underline text-[14px]">
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
            <button className="flex items-center gap-3 py-2 text-[#005f9e] hover:underline text-[14px]">
              <Move className="w-5 h-5" />
              <span>Move to...</span>
            </button>
            <button className="flex items-center gap-3 py-2 text-[#005f9e] hover:underline text-[14px]">
              <MoreVertical className="w-5 h-5" />
              <span>More options</span>
            </button>

             <div className="h-px bg-[#d0d0d7] my-2"></div>
          </div>

          {/* Selected Items List */}
          <div>
            <h3 className="text-[14px] font-bold text-[#363545] mb-2">Selected items</h3>
            <div className="flex flex-col gap-2">
              {selectedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1 group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {item.type === FileType.FOLDER ? <Folder className="w-4 h-4 text-[#363545]" /> : <FileText className="w-4 h-4 text-[#363545]" />}
                    <span className="text-[13px] text-[#363545] truncate">{item.name}</span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 text-[#a51d25]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // --- SINGLE ITEM PANEL ---
  const item = selectedItems[0];
  const isFile = item.type !== FileType.FOLDER;

  return (
    <aside className="w-[316px] bg-white border-l border-[#d0d0d7] flex flex-col shadow-[-2px_0_8px_rgba(0,0,0,0.15)] z-20 transition-all duration-300">
      {/* Header */}
      <div className="min-h-[4rem] py-3 flex items-start justify-between px-4 border-b border-[#d0d0d7]">
        <h2 className="text-[16px] font-bold text-[#363545] break-words pr-2 leading-tight mt-1">{item.name}</h2>
        <div className="flex items-center flex-shrink-0">
          <button className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#363545]">
            <Pencil className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#363545]">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview / Large Icon Section */}
        <div className="p-6 flex flex-col items-center border-b border-[#d0d0d7] bg-[#f9f9fb]">
          {isFile ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-white border border-[#d0d0d7] flex items-center justify-center shadow-sm">
                 {item.type === FileType.MODEL ? <Box className="w-16 h-16 text-[#363545]" /> : <FileText className="w-16 h-16 text-[#363545]" />}
              </div>
              <button className="bg-[#363545] hover:bg-black text-white text-[14px] font-semibold py-2 px-8 rounded-[2px]">
                View
              </button>
            </div>
          ) : (
            <Folder className="w-24 h-24 text-[#363545] fill-[#363545]/5" />
          )}

          {/* Action Row */}
          <div className="flex items-center justify-center gap-4 mt-6 w-full">
            <button className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#363545]" title="Permissions">
              <UserCog className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#363545]" title="Share">
              <Users className="w-5 h-5" />
            </button>
             {isFile && (
              <button className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#363545]" title="Download">
                <Download className="w-5 h-5" />
              </button>
             )}
            <button className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#363545]" title="More">
              <MoreVertical className="w-5 h-5" />
            </button>
             {!isFile && (
                <button className="p-2 hover:bg-[#eaeaef] rounded-[2px] text-[#a51d25]" title="Delete">
                  <Trash2 className="w-5 h-5" />
                </button>
             )}
          </div>
        </div>

        {/* Details Section */}
        <div className="p-4 border-b border-[#d0d0d7]">
           <h3 className="text-[12px] font-bold text-[#aeaeb6] uppercase mb-3 tracking-wide">Details</h3>
           <div className="flex flex-col gap-3 text-[14px] text-[#363545]">
             <div className="flex justify-between">
                <span className="text-[#6a6976]">Version</span>
                <span>{item.version} <a href="#" className="text-[#005f9e] hover:underline ml-1">See history</a></span>
             </div>
             <div className="flex justify-between">
                <span className="text-[#6a6976]">Size</span>
                <span>{item.size || '-'}</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[#6a6976]">Created</span>
                <span>{item.modifiedOn} By {item.modifiedBy}</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[#6a6976]">Modified</span>
                <span>{item.modifiedOn} By {item.modifiedBy}</span>
             </div>
           </div>
        </div>

        {/* Permissions / Properties Section */}
        <div className="p-4 border-b border-[#d0d0d7]">
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-[12px] font-bold text-[#aeaeb6] uppercase tracking-wide">Permissions</h3>
               <button className="text-[#363545]"><Pencil className="w-4 h-4" /></button>
            </div>
            <div className="text-[14px] text-[#363545]">
               <div className="mb-2">
                 <div className="font-semibold">All project members (Inherited)</div>
                 <div className="text-[#6a6976]">Full access</div>
               </div>
            </div>
        </div>
      </div>

      {/* Comment Section */}
      <div className="p-4 bg-[#f9f9fb] border-t border-[#d0d0d7]">
        <div className="relative">
           <div className="absolute left-3 top-2.5">
             <MessageCircle className="w-5 h-5 text-[#005f9e]" />
           </div>
           <input 
             type="text"
             placeholder="Add a comment..."
             className="w-full pl-10 pr-4 py-2 border border-[#d0d0d7] rounded-[2px] text-[14px] focus:outline-none focus:border-[#005f9e]"
           />
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;