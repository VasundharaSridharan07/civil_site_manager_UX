import React, { useState } from 'react';
import { X, ChevronDown } from "lucide-react";

interface LocationPermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

type AccessLevel = 'Full access' | 'Read only Access' | 'No access';

interface PermissionItem {
  id: string;
  name: string;
  initials: string;
  access: AccessLevel;
}

const LocationPermissionsDialog: React.FC<LocationPermissionsDialogProps> = ({ 
  isOpen, 
  onClose,
  title = "Project Location & CRS permissions"
}) => {
  const [defaultAccess, setDefaultAccess] = useState('No access');
  const [inputValue, setInputValue] = useState('');
  
  // Initialize with "All project members"
  const [permissions, setPermissions] = useState<PermissionItem[]>([
    { id: 'default', name: 'All project members', initials: 'AL', access: 'Read only Access' }
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const name = inputValue.trim();
      
      // Generate initials: first letter of first two words, or first 2 letters
      const words = name.split(' ');
      let initials = '';
      if (words.length >= 2) {
        initials = (words[0][0] + words[1][0]).toUpperCase();
      } else {
        initials = name.substring(0, 2).toUpperCase();
      }

      const newItem: PermissionItem = {
        id: Date.now().toString(),
        name,
        initials,
        access: 'Full access', // Default access for new additions
      };

      setPermissions([...permissions, newItem]);
      setInputValue('');
    }
  };

  const updateAccess = (id: string, newAccess: AccessLevel) => {
    setPermissions(permissions.map(item => 
      item.id === id ? { ...item, access: newAccess } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setPermissions(permissions.filter(item => item.id !== id));
  };

  const handleRemoveAll = () => {
    setPermissions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(10,10,10,0.45)]">
      <div className="relative flex flex-col w-[35rem] bg-white shadow-xl rounded-[2px] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 pb-2">
           <div className="flex justify-between items-start">
              <h2 className="text-[20px] font-normal text-[#363545] m-0">{title}</h2>
              <button onClick={onClose} className="text-[#363545] hover:text-black">
                <X className="w-5 h-5" />
              </button>
           </div>
           <p className="text-[12px] text-[#6a6976] mt-1">Location - Project Basepoint - Project Boundary and Coordinate reference system</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex flex-col gap-6">
           
           {/* Default Access Row */}
           <div className="flex items-center justify-between">
              <label className="text-[14px] text-[#aeaeb6]">Default access for project members</label>
              <div className="relative w-[140px]">
                 <select 
                   className="w-full border border-[#d0d0d7] rounded-[2px] pl-3 pr-8 py-1.5 text-[13px] text-[#aeaeb6] appearance-none outline-none bg-white hover:border-[#aeaeb6] cursor-pointer"
                   value={defaultAccess}
                   onChange={(e) => setDefaultAccess(e.target.value)}
                 >
                    <option value="No access">No access</option>
                    <option value="Read only">Read only</option>
                    <option value="Full access">Full access</option>
                 </select>
                 <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-[#aeaeb6] pointer-events-none" />
              </div>
           </div>

           {/* Add People Input */}
           <div>
              <input 
                 type="text" 
                 placeholder="Add people or groups" 
                 className="w-full border border-[#d0d0d7] rounded-[2px] px-3 py-2 text-[14px] text-[#363545] bg-white outline-none focus:border-[#005f9e]"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={handleKeyDown}
              />
           </div>

           {/* With Access */}
           <div>
              <div className="flex items-center gap-4 mb-4">
                 <span className="text-[14px] font-bold text-[#363545]">With Access</span>
                 {permissions.length > 0 && (
                   <button 
                     onClick={handleRemoveAll}
                     className="text-[12px] font-bold text-[#005f9e] hover:underline"
                   >
                     Remove all
                   </button>
                 )}
              </div>

              {/* List Block */}
              {permissions.length > 0 ? (
                <div className="bg-[#fcfcfd] border border-[#f1f1f1] rounded-[2px] p-4 flex flex-col gap-3 max-h-[250px] overflow-y-auto">
                   {permissions.map((item) => (
                      <div key={item.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-[#eaeaef] flex items-center justify-center text-[12px] font-bold text-[#6a6976]">
                                {item.initials}
                             </div>
                             <span className="text-[14px] text-[#363545]">{item.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                              {/* Access Dropdown */}
                              <div className="relative">
                                  <select 
                                      className="appearance-none bg-transparent hover:bg-[#eaeaef] text-[#363545] text-[13px] pl-2 pr-6 py-1 rounded-[2px] outline-none cursor-pointer border-none transition-colors"
                                      value={item.access}
                                      onChange={(e) => updateAccess(item.id, e.target.value as AccessLevel)}
                                  >
                                      <option value="Full access">Full access</option>
                                      <option value="Read only Access">Read only Access</option>
                                      <option value="No access">No access</option>
                                  </select>
                                  <ChevronDown className="absolute right-1 top-[7px] w-3 h-3 text-[#6a6976] pointer-events-none" />
                              </div>

                              {/* Remove Item Button */}
                              <button 
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-[#6a6976] hover:text-[#363545] hover:bg-[#eaeaef] rounded-[2px]"
                              >
                                <X className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="bg-[#fcfcfd] border border-[#f1f1f1] rounded-[2px] p-8 flex flex-col items-center justify-center text-[#aeaeb6] italic text-[13px]">
                   No permissions assigned.
                </div>
              )}
           </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-4 flex justify-end items-center border-t border-[#d0d0d7] mt-2">
           <div className="flex gap-3 items-center">
              <button 
                onClick={onClose} 
                className="text-[#363545] text-[14px] font-normal hover:underline px-2"
              >
                Cancel
              </button>
              <button 
                onClick={onClose} 
                className="bg-[#005f9e] text-white text-[14px] font-bold py-2 px-5 rounded-[2px] hover:bg-[#00437b] transition-colors"
              >
                Save
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionsDialog;