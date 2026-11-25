import { Icon } from '../ui'

const RAIL_BG = '#2c2d36'
const RAIL_FG = 'rgba(255,255,255,0.78)'
const RAIL_FG_ACTIVE = '#ffffff'
const ACTIVE_BG = 'rgba(255,255,255,0.12)'
const HOVER_BG = 'rgba(255,255,255,0.06)'

interface RailItem {
  id: string
  icon: string
  label: string
}

const ITEMS: RailItem[] = [
  { id: '3d', icon: 'view_in_ar', label: '3D Viewer' },
  { id: 'layers', icon: 'layers', label: 'Layers' },
  { id: 'frame', icon: 'crop_free', label: 'Frame' },
  { id: 'anchor', icon: 'anchor', label: 'Anchor' },
  { id: 'route', icon: 'route', label: 'Route' },
]

const ACTIVE_ID = '3d'

export const LeftIconRail = () => {
  return (
    <nav
      aria-label="3D viewer tools"
      style={{
        width: '40px',
        minWidth: '40px',
        backgroundColor: RAIL_BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '8px',
        gap: '2px',
      }}
    >
      {ITEMS.map((item) => {
        const isActive = item.id === ACTIVE_ID
        return (
          <button
            key={item.id}
            aria-label={item.label}
            title={item.label}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = HOVER_BG
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
            }}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isActive ? ACTIVE_BG : 'transparent',
              color: isActive ? RAIL_FG_ACTIVE : RAIL_FG,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'background-color 120ms ease',
            }}
          >
            <Icon name={item.icon} decorative size="sm" />
          </button>
        )
      })}
    </nav>
  )
}
