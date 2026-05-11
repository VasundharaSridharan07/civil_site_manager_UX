import React, { useState } from 'react';
import { X } from "lucide-react";

interface UserPermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const UserPermissionsDialog: React.FC<UserPermissionsDialogProps> = ({ 
  isOpen, 
  onClose,
  title = "User permissions"
}) => {
  const [accessLevel, setAccessLevel] = useState<'full' | 'readonly' | 'no'>('full');
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[40rem] bg-white shadow-xl rounded-[2px]">
        {/* Header */}
        <header className="flex items-start justify-between p-6 pb-2">
          <h2 className="text-[20px] font-normal text-[#363545] m-0">{title}</h2>
          <button onClick={onClose} className="text-[#363545] hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <div className="p-6">
          
          {/* Default Access Section */}
          <div className="mb-6">
            <h3 className="text-[14px] font-bold text-[#363545] mb-1">Default access for project members</h3>
            <p className="text-[12px] text-[#6a6976] mb-3">(ADMIN users always have Full Access)</p>
            
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${accessLevel === 'full' ? 'border-[#005f9e]' : 'border-[#d0d0d7] group-hover:border-[#005f9e]'}`}>
                  {accessLevel === 'full' && <div className="w-2.5 h-2.5 rounded-full bg-[#005f9e]" />}
                </div>
                <input 
                  type="radio" 
                  name="access" 
                  className="hidden" 
                  checked={accessLevel === 'full'} 
                  onChange={() => setAccessLevel('full')} 
                />
                <span className="text-[14px] text-[#363545]">Full access</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${accessLevel === 'readonly' ? 'border-[#005f9e]' : 'border-[#d0d0d7] group-hover:border-[#005f9e]'}`}>
                  {accessLevel === 'readonly' && <div className="w-2.5 h-2.5 rounded-full bg-[#005f9e]" />}
                </div>
                <input 
                  type="radio" 
                  name="access" 
                  className="hidden" 
                  checked={accessLevel === 'readonly'} 
                  onChange={() => setAccessLevel('readonly')} 
                />
                <span className="text-[14px] text-[#363545]">Read only access</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${accessLevel === 'no' ? 'border-[#005f9e]' : 'border-[#d0d0d7] group-hover:border-[#005f9e]'}`}>
                  {accessLevel === 'no' && <div className="w-2.5 h-2.5 rounded-full bg-[#005f9e]" />}
                </div>
                <input 
                  type="radio" 
                  name="access" 
                  className="hidden" 
                  checked={accessLevel === 'no'} 
                  onChange={() => setAccessLevel('no')} 
                />
                <span className="text-[14px] text-[#363545]">No access</span>
              </label>
            </div>
          </div>

          {/* Specific Users Section */}
          <div>
            <h3 className="text-[14px] font-bold text-[#363545] mb-2">Access for specific users and groups</h3>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Begin typing to search..."
              className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] outline-none bg-white focus:border-[#005f9e]"
            />
          </div>
        </div>

        <div className="h-px bg-[#d0d0d7] mx-6"></div>

        {/* Footer */}
        <footer className="flex justify-end gap-4 p-6 pt-4 bg-white">
          <button 
            onClick={onClose} 
            className="text-[#363545] text-[14px] font-bold hover:underline"
          >
            Cancel
          </button>
          <button 
            onClick={onClose} 
            className="bg-[#6c9fce] text-white text-[14px] font-bold py-2 px-6 rounded-[2px] hover:bg-[#005f9e] transition-colors"
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};

export default UserPermissionsDialog;