import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Icon } from '../components/ui'
import Sidebar from '../connect-crs/components/Sidebar'
import Explorer from '../connect-crs/components/Explorer'
import RightPanel from '../connect-crs/components/RightPanel'
import ProjectDetails from '../connect-crs/components/ProjectDetails'
import { FileType } from '../connect-crs/types'
import type {
  FileSystemItem,
  BreadcrumbItem,
  SelectionState,
  ViewType,
} from '../connect-crs/types'

const MOCK_FILES: FileSystemItem[] = [
  { id: '1', parentId: null, name: 'Architectural Models', type: FileType.FOLDER, modifiedBy: 'Jane Doe', modifiedOn: 'Oct 24, 2024', version: 1 },
  { id: '2', parentId: null, name: 'Structural Models', type: FileType.FOLDER, modifiedBy: 'John Smith', modifiedOn: 'Oct 22, 2024', version: 1 },
  { id: '3', parentId: null, name: 'MEP', type: FileType.FOLDER, modifiedBy: 'Admin User', modifiedOn: 'Sep 15, 2024', version: 1 },
  { id: '4', parentId: null, name: 'Site Photos', type: FileType.FOLDER, modifiedBy: 'Jane Doe', modifiedOn: 'Aug 10, 2024', version: 1 },
  { id: '11', parentId: '1', name: 'Building_A.ifc', type: FileType.MODEL, size: '45.2 MB', modifiedBy: 'Jane Doe', modifiedOn: 'Oct 24, 2024', version: 3 },
  { id: '12', parentId: '1', name: 'Building_B.ifc', type: FileType.MODEL, size: '32.1 MB', modifiedBy: 'Jane Doe', modifiedOn: 'Oct 23, 2024', version: 2 },
  { id: '13', parentId: '1', name: 'Facade Details', type: FileType.FOLDER, modifiedBy: 'Jane Doe', modifiedOn: 'Oct 20, 2024', version: 1 },
  { id: '131', parentId: '13', name: 'Glass_Panel_Spec.pdf', type: FileType.FILE, size: '2.4 MB', modifiedBy: 'Architect', modifiedOn: 'Oct 20, 2024', version: 1 },
  { id: '132', parentId: '13', name: 'Mounting_Bracket.dwg', type: FileType.FILE, size: '5.1 MB', modifiedBy: 'Engineer', modifiedOn: 'Oct 19, 2024', version: 1 },
  { id: '41', parentId: '4', name: 'Foundation_Pour.jpg', type: FileType.IMAGE, size: '4.5 MB', modifiedBy: 'Site Manager', modifiedOn: 'Aug 10, 2024', version: 1 },
  { id: '42', parentId: '4', name: 'Aerial_View.jpg', type: FileType.IMAGE, size: '12.8 MB', modifiedBy: 'Drone Op', modifiedOn: 'Aug 09, 2024', version: 1 },
]

export const ConnectProjectDetail = () => {
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [selection, setSelection] = useState<SelectionState>(new Set())
  const [activeView, setActiveView] = useState<ViewType>('project-details')

  const explorerItems = useMemo(
    () => MOCK_FILES.filter((item) => item.parentId === currentFolderId),
    [currentFolderId],
  )

  const breadcrumbs = useMemo(() => {
    const path: BreadcrumbItem[] = []
    let id = currentFolderId
    let count = 0
    while (id && count < 10) {
      const folder = MOCK_FILES.find((f) => f.id === id)
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name })
        id = folder.parentId
      } else {
        break
      }
      count++
    }
    return path
  }, [currentFolderId])

  const handleNavigate = (id: string | null) => {
    setCurrentFolderId(id)
    setSelection(new Set())
  }

  const handleSelect = (id: string, isMulti: boolean) => {
    setSelection((prev) => {
      const next = new Set(isMulti ? prev : [])
      if (prev.has(id)) {
        if (isMulti) next.delete(id)
        else next.add(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = (ids: string[]) => {
    setSelection((prev) => {
      const allSelected = ids.every((id) => prev.has(id))
      const next = new Set(prev)
      if (allSelected) {
        ids.forEach((id) => next.delete(id))
      } else {
        ids.forEach((id) => next.add(id))
      }
      return next
    })
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden font-['Open_Sans']">
      {/* Modus Navbar */}
      <Navbar
        appName="Trimble Connect"
        userName="Vasundhara Sridharan"
        userEmail="vs@trimble.com"
        showThemeSwitcher
      >
        <button
          slot="start"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            color: 'var(--modus-wc-color-base-content)',
          }}
        >
          <Icon name="menu" decorative size="sm" />
        </button>
      </Navbar>

      {/* Content area below the navbar */}
      <div className="flex min-h-0 flex-1 pt-14 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeView={activeView}
          onNavigate={(view: ViewType) => setActiveView(view)}
          onBack={() => navigate('/connect')}
        />

        <main
          className={`flex min-h-0 flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'ml-16' : 'ml-[16rem]'
          }`}
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

              <div
                className={`transition-all duration-300 ease-in-out border-l border-[#d0d0d7] ${
                  selection.size > 0 ? 'w-[316px]' : 'w-0 border-none'
                }`}
              >
                <div className="w-[316px] h-full">
                  <RightPanel
                    selection={selection}
                    allItems={MOCK_FILES}
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

          {activeView !== 'explorer' && activeView !== 'project-details' && (
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
  )
}
