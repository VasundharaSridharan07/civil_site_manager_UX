import { useState } from 'react'
import { Icon } from './ui'

const BG = '#0e3a5d'
const BG_DARKER = '#0a2e4a'
const TEXT = 'rgba(255,255,255,0.78)'
const TEXT_BRIGHT = '#fff'
const ACTIVE_BG = '#1a6fa0'
const HOVER_BG = 'rgba(255,255,255,0.07)'
const DIVIDER = 'rgba(255,255,255,0.08)'

interface NavItem {
  id: string
  label: string
  icon: string
  children?: NavItem[]
  isSeparator?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'map', label: 'Map', icon: 'map' },
  { id: '3d-viewer', label: '3D Viewer', icon: 'view_in_ar' },
  { id: 'designs', label: 'Designs', icon: 'description' },
  { id: 'members', label: 'Members', icon: 'people' },
  { id: 'devices', label: 'Devices', icon: 'devices' },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    children: [
      { id: 'general', label: 'General', icon: 'tune' },
      { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    ],
  },
]

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'my-projects', label: 'My Projects', icon: 'folder' },
  { id: 'my-accounts', label: 'My Accounts', icon: 'business' },
]

interface WorksSidebarProps {
  projectName: string
  activeId: string
  onSelect: (id: string) => void
  onMyProjects?: () => void
}

export const WorksSidebar = ({
  projectName,
  activeId,
  onSelect,
  onMyProjects,
}: WorksSidebarProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    settings: false,
  })

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const renderItem = (item: NavItem, depth = 0) => {
    const isActive = item.id === activeId
    const hasChildren = !!item.children
    const isOpen = expanded[item.id]

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (item.id === 'my-projects' && onMyProjects) {
              onMyProjects()
              return
            }
            if (hasChildren) toggle(item.id)
            else onSelect(item.id)
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.backgroundColor = HOVER_BG
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: depth > 0 ? '7px 12px 7px 40px' : '9px 12px',
            border: 'none',
            borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
            borderRadius: 0,
            backgroundColor: isActive ? ACTIVE_BG : 'transparent',
            color: isActive ? TEXT_BRIGHT : TEXT,
            cursor: 'pointer',
            fontSize: depth > 0 ? '12px' : '13px',
            fontWeight: isActive ? 600 : 400,
            textAlign: 'left',
            lineHeight: '20px',
            transition: 'background-color 120ms ease',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '18px',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: isActive ? 1 : 0.85,
            }}
          >
            <Icon name={item.icon} decorative size="sm" />
          </span>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
          {hasChildren && (
            <span style={{ display: 'flex', alignItems: 'center', opacity: 0.5 }}>
              <Icon name={isOpen ? 'expand_less' : 'expand_more'} decorative size="sm" />
            </span>
          )}
        </button>
        {hasChildren && isOpen && item.children!.length > 0 && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav
      style={{
        width: '200px',
        minWidth: '200px',
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          padding: '16px 14px 14px',
          backgroundColor: BG_DARKER,
          borderBottom: `1px solid ${DIVIDER}`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: '14px',
            marginBottom: '4px',
          }}
        >
          Project
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: TEXT_BRIGHT,
            lineHeight: '18px',
            wordBreak: 'break-word',
          }}
        >
          {projectName}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '6px', paddingBottom: '6px' }}>
        {NAV_ITEMS.map((item) => renderItem(item))}
      </div>

      <div style={{ borderTop: `1px solid ${DIVIDER}`, paddingTop: '6px', paddingBottom: '6px' }}>
        {BOTTOM_ITEMS.map((item) => renderItem(item))}
      </div>

      <div
        style={{
          padding: '14px 14px',
          borderTop: `1px solid ${DIVIDER}`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '11px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.04em',
          }}
        >
          TRIMBLE
        </p>
        <p
          style={{
            margin: '3px 0 0',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.35)',
            lineHeight: '13px',
          }}
        >
          Privacy &middot; Terms of Use
          <br />
          &copy; 2026 Trimble Inc.
        </p>
      </div>
    </nav>
  )
}
