import React from 'react';

interface DraftingToolbarProps {
  onCancel: () => void;
  onDone: () => void;
}

const DraftingToolbar: React.FC<DraftingToolbarProps> = ({ onCancel, onDone }) => {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white p-2 rounded-[2px] shadow-md border border-[#d0d0d7] pointer-events-auto z-30">
      <button onClick={onCancel} className="px-3 py-1 text-[12px] font-semibold text-[#363545] border border-[#d0d0d7] rounded-[2px] hover:bg-[#f3f3f7]">Cancel</button>
      <button onClick={onDone} className="px-3 py-1 text-[12px] font-semibold text-white bg-[#005f9e] rounded-[2px] hover:bg-[#00437b]">Done</button>
    </div>
  );
};

export default DraftingToolbar;