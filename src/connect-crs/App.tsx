import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Explorer from './components/Explorer';
import RightPanel from './components/RightPanel';
import ProjectDetails from './components/ProjectDetails';
import { FileType } from './types';
import type { FileSystemItem, BreadcrumbItem, SelectionState, ViewType } from './types';

// Mock Data Generation
const MOCK_FILES: FileSystemItem[] = [
  { id: '1', parentId: null, name: 'Architectural Models', type: FileType.FOLDER, modifiedBy: 'Jane Doe', modifiedOn: 'Oct 24, 2024', version: 1 },
  { id: '2', parentId: null, name: 'Structural Models', type: FileType.FOLDER, modifiedBy: 'John Smith', modifiedOn: 'Oct 22, 2024', version: 1 },
  { id: '3', parentId: null, name: 'MEP', type: FileType.FOLDER, modifiedBy: 'Admin User', modifiedOn: 'Sep 15, 2024', version: 1 },
  { id: '4', parentId: null, name: 'Site Photos', type: FileType.FOLDER, modifiedBy: 'Jane Doe', modifiedOn: 'Aug 10, 2024', version: 1 },
  
  // Inside Architectural Models (id: 1)
  { id: '11', parentId: '1', name: 'Building_A.ifc', type: FileType.MODEL, size: '45.2 MB', modifiedBy: 'Jane Doe', modifiedOn: 'Oct 24, 2024', version: 3 },
  { id: '12', parentId: '1', name: 'Building_B.ifc', type: FileType.MODEL, size: '32.1 MB', modifiedBy: 'Jane Doe', modifiedOn: 'Oct 23, 2024', version: 2 },
  { id: '13', parentId: '1', name: 'Facade Details', type: FileType.FOLDER, modifiedBy: 'Jane Doe', modifiedOn: 'Oct 20, 2024', version: 1 },
  
  // Inside Facade Details (id: 13)
  { id: '131', parentId: '13', name: 'Glass_Panel_Spec.pdf', type: FileType.FILE, size: '2.4 MB', modifiedBy: 'Architect', modifiedOn: 'Oct 20, 2024', version: 1 },
  { id: '132', parentId: '13', name: 'Mounting_Bracket.dwg', type: FileType.FILE, size: '5.1 MB', modifiedBy: 'Engineer', modifiedOn: 'Oct 19, 2024', version: 1 },

  // Inside Site Photos (id: 4)
  { id: '41', parentId: '4', name: 'Foundation_Pour.jpg', type: FileType.IMAGE, size: '4.5 MB', modifiedBy: 'Site Manager', modifiedOn: 'Aug 10, 2024', version: 1 },
  { id: '42', parentId: '4', name: 'Aerial_View.jpg', type: FileType.IMAGE, size: '12.8 MB', modifiedBy: 'Drone Op', modifiedOn: 'Aug 09, 2024', version: 1 },
];

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionState>(new Set());
  const [activeView, setActiveView] = useState<ViewType>('project-details');

  // Determine items to display in explorer
  const explorerItems = useMemo(() => {
    return MOCK_FILES.filter(item => item.parentId === currentFolderId);
  }, [currentFolderId]);

  // Determine current breadcrumbs
  const breadcrumbs = useMemo(() => {
    const path: BreadcrumbItem[] = [];
    let currentId = currentFolderId;
    
    // Safety break loop
    let count = 0;
    while (currentId && count < 10) {
      const folder = MOCK_FILES.find(f => f.id === currentId);
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break;
      }
      count++;
    }
    return path;
  }, [currentFolderId]);

  // Handlers
  const handleNavigate = (id: string | null) => {
    setCurrentFolderId(id);
    setSelection(new Set()); // Clear selection on nav
  };

  const handleSelect = (id: string, isMulti: boolean) => {
    setSelection(prev => {
      const newSet = new Set(isMulti ? prev : []);
      if (prev.has(id)) {
        if (isMulti) newSet.delete(id);
        else newSet.add(id); // If single click on selected, keep selected
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    setSelection(prev => {
       // If all currently visible are selected, deselect all. Otherwise select all.
       const allVisibleSelected = ids.every(id => prev.has(id));
       const newSet = new Set(prev);
       
       if (allVisibleSelected) {
          ids.forEach(id => newSet.delete(id));
       } else {
          ids.forEach(id => newSet.add(id));
       }
       return newSet;
    });
  };

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
  };

  return (
    <div className="flex min-h-0 flex-col h-full overflow-hidden font-['Open_Sans']">
      <Header toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex min-h-0 flex-1 pt-16 h-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          activeView={activeView}
          onNavigate={handleViewChange}
        />
        
        {/* Main Content Area */}
        <main 
           className={`flex min-h-0 flex-1 flex overflow-hidden transition-all duration-300 ease-in-out
             ${sidebarCollapsed ? 'ml-16' : 'ml-[16rem]'}
           `}
        >
          {activeView === 'explorer' && (
            <div className="flex-1 overflow-hidden relative flex">
               <div className="flex-1 h-full overflow-hidden">
                 <Explorer 
                    items={explorerItems}
                    currentPath={breadcrumbs}
                    selection={selection}
                    onNavigate={handleNavigate}
                    onSelect={handleSelect}
                    onSelectAll={handleSelectAll}
                 />
               </div>
               
               {/* Right Panel - Slide in/out or just conditional render with transition */}
               <div className={`transition-all duration-300 ease-in-out border-l border-[#d0d0d7] ${selection.size > 0 ? 'w-[316px]' : 'w-0 border-none'}`}>
                   <div className="w-[316px] h-full">
                      <RightPanel 
                          selection={selection}
                          allItems={MOCK_FILES} // Pass all for searching selected items
                          onClose={() => setSelection(new Set())}
                      />
                   </div>
               </div>
            </div>
          )}

          {activeView === 'project-details' && (
            <div className="flex-1 overflow-hidden">
              <ProjectDetails />
            </div>
          )}

          {(activeView !== 'explorer' && activeView !== 'project-details') && (
            <div className="flex-1 flex items-center justify-center bg-[#f3f3f7] text-[#6a6976]">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Work in Progress</h2>
                <p>The {activeView} view is under construction.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
