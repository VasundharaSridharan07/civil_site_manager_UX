import React, { useState, useEffect } from 'react';
import { Menu, Search, HelpCircle, LayoutGrid, UserCircle, Settings, ChevronDown } from "lucide-react";
import { getPublishedCrsSource, setPublishedCrsSource, type PublishedCrsSource } from '../api/publishedCrsSource';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [source, setSource] = useState<PublishedCrsSource>(() => getPublishedCrsSource());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const onChange = () => setSource(getPublishedCrsSource());
    window.addEventListener('publishedCrsSourceChange', onChange);
    return () => window.removeEventListener('publishedCrsSourceChange', onChange);
  }, []);

  const handleSourceSelect = (value: PublishedCrsSource) => {
    setPublishedCrsSource(value);
    setSource(value);
    setSettingsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#d0d0d7] h-16 flex items-center justify-between px-4 [backface-visibility:hidden] transform-gpu">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu */}
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-[#eaeaef] rounded-[2px] transition-colors"
        >
          <Menu className="w-6 h-6 text-[#363545]" />
        </button>

        {/* Logo */}
        <img
          src="https://web.connect.trimble.com/assets/img/trimbleconnect_header.svg"
          alt="Trimble Connect"
          className="h-8"
        />

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-[#d0d0d7] hidden sm:block"></div>

        {/* Project Context Switcher */}
        <select className="text-[14px] text-[#363545] border-none outline-none bg-transparent hidden sm:block font-semibold cursor-pointer">
          <option>AI in Connect internal test models</option>
          <option>Construction Project Alpha</option>
          <option>Infrastructure Demo</option>
        </select>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Published CRS source (TGR / CSD) */}
        <div className="relative">
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className="p-2 hover:bg-[#eaeaef] rounded-[2px] flex items-center gap-1"
            title="Published CRS source"
          >
            <Settings className="w-5 h-5 text-[#363545]" />
            <span className="text-[12px] text-[#363545] font-medium hidden sm:inline">CRS: {source}</span>
            <ChevronDown className="w-4 h-4 text-[#363545] hidden sm:block" />
          </button>
          {settingsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden
                onClick={() => setSettingsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-white border border-[#d0d0d7] rounded-[4px] shadow-lg py-1">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[#6a6976] uppercase tracking-wide">
                  Published CRS source
                </div>
                <button
                  onClick={() => handleSourceSelect('TGR')}
                  className={`w-full text-left px-3 py-2 text-[14px] ${source === 'TGR' ? 'bg-[#e8f4fc] text-[#005f9e] font-medium' : 'text-[#363545] hover:bg-[#eaeaef]'}`}
                >
                  TGR
                </button>
                <button
                  onClick={() => handleSourceSelect('CSD')}
                  className={`w-full text-left px-3 py-2 text-[14px] ${source === 'CSD' ? 'bg-[#e8f4fc] text-[#005f9e] font-medium' : 'text-[#363545] hover:bg-[#eaeaef]'}`}
                >
                  CSD
                </button>
              </div>
            </>
          )}
        </div>

        {/* Global Search */}
        <button className="p-2 hover:bg-[#eaeaef] rounded-[2px]">
          <Search className="w-5 h-5 text-[#363545]" />
        </button>

        {/* Help/Support */}
        <button className="p-2 hover:bg-[#eaeaef] rounded-[2px]">
          <HelpCircle className="w-5 h-5 text-[#363545]" />
        </button>

        {/* App Switcher */}
        <button className="p-2 hover:bg-[#eaeaef] rounded-[2px]">
          <LayoutGrid className="w-5 h-5 text-[#363545]" />
        </button>

        {/* User Profile */}
        <button className="p-2 hover:bg-[#eaeaef] rounded-full">
          <UserCircle className="w-8 h-8 text-[#363545]" />
        </button>
      </div>
    </header>
  );
};

export default Header;