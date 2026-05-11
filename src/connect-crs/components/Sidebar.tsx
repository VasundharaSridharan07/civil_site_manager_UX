import React, { useState } from 'react';
import {
  ArrowLeft,
  Folder,
  FolderOpen,
  Camera,
  Package,
  History,
  ClipboardList,
  Box,
  ListTodo,
  Users,
  Library,
  Settings,
  Building2,
  ShieldCheck,
  LayoutGrid,
  Bell,
  Ruler,
  Tag,
  Key,
  RefreshCcw,
  ChevronDown,
} from "lucide-react";
import type { ViewType } from '../types';

interface SidebarProps {
  collapsed: boolean;
  activeView?: ViewType;
  onNavigate: (view: ViewType) => void;
  onBack?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, activeView = 'explorer', onNavigate, onBack }) => {
  const [dataOpen, setDataOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true); // Default open to show Project Details

  // Helper to render links
  const renderLink = (
    icon: React.ReactNode, 
    label: string, 
    viewKey: ViewType, 
    isSubItem = false
  ) => {
    // Styling logic based on collapsed state and hierarchy
    const baseClasses = "flex items-center gap-2 py-3 text-[14px] hover:bg-[#07599b] transition-colors cursor-pointer whitespace-nowrap";
    
    // Strict alignment rules:
    // Collapsed: justify-center, px-2
    // Expanded Top Level: px-4
    // Expanded Sub Level: px-8
    
    let containerClasses = "";
    
    if (collapsed) {
      containerClasses = "justify-center px-2";
    } else {
      containerClasses = isSubItem ? "px-8" : "px-4";
    }

    // Active state styling
    const isActive = activeView === viewKey;
    const activeClasses = isActive 
      ? "bg-[#0c77be] border-l-4 border-white" 
      : "border-l-4 border-transparent";
    
    // If we're rendering a link that isn't connected to a real view yet, passing a generic key
    const handleClick = () => {
      onNavigate(viewKey);
    };

    return (
      <div 
        className={`${baseClasses} ${containerClasses} ${activeClasses}`}
        onClick={handleClick}
      >
        {icon}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
    );
  };

  // Helper for accordions
  const renderAccordion = (
    icon: React.ReactNode, 
    label: string, 
    isOpen: boolean, 
    setIsOpen: (v: boolean) => void,
    children: React.ReactNode
  ) => {
    return (
      <div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full py-3 text-[14px] hover:bg-[#07599b] flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} transition-colors`}
        >
          <div className="flex items-center gap-2">
            {icon}
            {!collapsed && <span>{label}</span>}
          </div>
          {!collapsed && (
            <ChevronDown className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </button>
        {/* Children container */}
        <div className={`${isOpen ? 'block' : 'hidden'}`}>
          {children}
        </div>
      </div>
    );
  };

  // Icon sizing constants
  const mainIconClass = "w-5 h-5 text-white flex-shrink-0";
  const subIconClass = "w-[18px] h-[18px] text-white flex-shrink-0";

  return (
    <aside 
      className={`fixed left-0 top-14 bottom-0 bg-[#00437b] text-white overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out z-40 [backface-visibility:hidden] transform-gpu
        ${collapsed ? 'w-16' : 'w-[16rem]'}
      `}
    >
      {/* All Projects - Back Link */}
      <div
        className={`flex items-center gap-2 py-3 text-[14px] hover:bg-[#07599b] cursor-pointer whitespace-nowrap ${collapsed ? 'justify-center px-2' : 'px-4'}`}
        onClick={onBack}
      >
        <ArrowLeft className={mainIconClass} />
        {!collapsed && <span>All Projects</span>}
      </div>

      {/* DATA Accordion */}
      {renderAccordion(
        <Folder className={mainIconClass} />,
        "Data",
        dataOpen,
        setDataOpen,
        <>
          {renderLink(<FolderOpen className={subIconClass} />, "Explorer", 'explorer', true)}
          {renderLink(<Camera className={subIconClass} />, "Views", 'views', true)}
          {renderLink(<Package className={subIconClass} />, "Releases", 'releases', true)}
        </>
      )}

      {/* Top Level Items */}
      {renderLink(<History className={mainIconClass} />, "Activity", 'activity')}
      {renderLink(<ClipboardList className={mainIconClass} />, "BCF Topics", 'bcf')}
      {renderLink(<Box className={mainIconClass} />, "Shared Model", 'shared-model')}
      {renderLink(<ListTodo className={mainIconClass} />, "ToDo", 'todo')}
      {renderLink(<Users className={mainIconClass} />, "Team", 'team')}
      {renderLink(<Library className={mainIconClass} />, "Property Set Libraries", 'property-libraries')}

      {/* SETTINGS Accordion */}
      {renderAccordion(
        <Settings className={mainIconClass} />,
        "Settings",
        settingsOpen,
        setSettingsOpen,
        <>
          {renderLink(<Building2 className={subIconClass} />, "Project Details", 'project-details', true)}
          {renderLink(<ShieldCheck className={subIconClass} />, "Permissions Overview", 'permissions-overview', true)}
          {renderLink(<ClipboardList className={subIconClass} />, "BCF Topics", 'settings-bcf', true)}
          {renderLink(<LayoutGrid className={subIconClass} />, "Extensions", 'extensions', true)}
          {renderLink(<Bell className={subIconClass} />, "Notifications", 'notifications', true)}
          {renderLink(<Ruler className={subIconClass} />, "Units", 'units', true)}
          {renderLink(<Tag className={subIconClass} />, "Tags", 'tags', true)}
          {renderLink(<Key className={subIconClass} />, "Permissions", 'permissions', true)}
          {renderLink(<RefreshCcw className={subIconClass} />, "Sync", 'sync', true)}
        </>
      )}
    </aside>
  );
};

export default Sidebar;