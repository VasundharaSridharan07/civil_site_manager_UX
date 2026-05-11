import React, { useState } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  disabledTooltip?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, className = "", disabled = false, disabledTooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (disabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2500);
      return;
    }
    onChange(!checked);
  };

  return (
    <div
      className={`relative flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => disabled && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-[#005f9e]' : 'bg-[#d0d0d7]'}`}>
        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${checked ? 'left-[20px]' : 'left-[3px]'}`}></div>
      </div>
      {label && <span className="flex items-center gap-2 text-[14px] text-[#363545]">{label}</span>}

      {disabled && disabledTooltip && showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-50 px-3 py-2 bg-[#363545] text-white text-[12px] rounded shadow-lg whitespace-nowrap">
          {disabledTooltip}
          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#363545] rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default ToggleSwitch;
