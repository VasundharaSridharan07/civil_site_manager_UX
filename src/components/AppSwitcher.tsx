import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppConfig } from '../context/AppConfigContext'
import { Icon } from './ui'

interface AppSwitcherProps {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
}

// ── App data ─────────────────────────────────────────────────────────────────
interface AppEntry {
  id: string
  name: string
  description: string
  icon: string
  url: string
  /** Route prefix used to determine which app is active */
  routePrefix: string
}

const APPS: AppEntry[] = [
  { id: 'connect',        name: 'Trimble Connect',    description: 'Project Management',                 icon: 'link',           url: '/connect',  routePrefix: '/connect' },
  { id: 'works',          name: 'Works+',             description: 'Civil Site Management',               icon: 'terrain',        url: '/',         routePrefix: '/' },
  { id: 'geo',            name: 'Geo+',               description: 'Survey Management',                   icon: 'globe',          url: '',          routePrefix: '' },
  { id: 'devices',        name: 'Device Manager',     description: 'Devices & Asset Management',          icon: 'devices',        url: '',          routePrefix: '' },
  { id: 'dispatch',       name: 'Dispatch',           description: 'Data Assignments to Field',           icon: 'send',           url: '',          routePrefix: '' },
  { id: 'dashboards',     name: 'Dashboards',         description: 'Metrics Overview and Reports',        icon: 'dashboard',      url: '',          routePrefix: '' },
  { id: 'viewer3d',       name: '3D Viewer',          description: '3D Model Viewer',                     icon: '3d_terrain',     url: '',          routePrefix: '' },
  { id: 'photogrammetry', name: 'Photogrammetry',     description: 'Photogrammetry',                      icon: 'camera',         url: '',          routePrefix: '' },
  { id: 'sketchup',       name: 'SketchUp',           description: 'SketchUp',                            icon: 'edit_square',    url: '',          routePrefix: '' },
  { id: 'tekla',          name: 'Tekla Structures',   description: 'Tekla Structures',                    icon: 'grid_view',      url: '',          routePrefix: '' },
  { id: 'siteviz',        name: 'Site Viz',           description: 'Site Visualization',                  icon: '3d_terrain',     url: '',          routePrefix: '' },
  { id: 'modelviewer',    name: 'Model Viewer',       description: 'CAD / BIM Model Review',              icon: 'cube',           url: '',          routePrefix: '' },
  { id: 'pointcloud',     name: 'Point Cloud',        description: 'Point Cloud Viewer',                  icon: 'snow_particle',  url: '',          routePrefix: '' },
  { id: 'drone',          name: 'Drone Capture',      description: 'Drone / Reality Capture',             icon: 'drone',          url: '',          routePrefix: '' },
]

/** V2-only tiles — shown in the grouped switcher under "3D Viewer", hidden from the V1 flat list. */
const V2_ONLY_IDS = ['siteviz', 'modelviewer', 'pointcloud', 'drone']

const V2_GROUPS = [
  {
    title: 'Project & Field',
    apps: APPS.filter((a) => ['connect', 'works', 'geo'].includes(a.id)),
  },
  {
    title: 'Operations',
    apps: APPS.filter((a) => ['devices', 'dispatch', 'dashboards'].includes(a.id)),
  },
  {
    title: '3D Viewer',
    apps: APPS.filter((a) => ['siteviz', 'modelviewer', 'pointcloud', 'drone'].includes(a.id)),
  },
  {
    title: 'Design & Engineering',
    apps: APPS.filter((a) => ['photogrammetry', 'sketchup', 'tekla'].includes(a.id)),
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function isActiveApp(app: AppEntry, pathname: string): boolean {
  if (app.id === 'works') return !pathname.startsWith('/connect')
  return app.routePrefix !== '' && pathname.startsWith(app.routePrefix)
}

// ── Shared app tile ───────────────────────────────────────────────────────────
const AppTile = ({
  app,
  isCurrent,
  onSelect,
}: {
  app: AppEntry
  isCurrent: boolean
  onSelect: (app: AppEntry) => void
}) => (
  <button
    title={app.name}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      padding: '12px 8px',
      borderRadius: '8px',
      border: isCurrent
        ? '2px solid var(--modus-wc-color-primary)'
        : '2px solid transparent',
      backgroundColor: isCurrent
        ? 'var(--modus-wc-color-base-100)'
        : 'transparent',
      cursor: 'pointer',
      width: '80px',
      transition: 'background-color 120ms ease, border-color 120ms ease',
    }}
    onMouseEnter={(e) => {
      if (!isCurrent)
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          'var(--modus-wc-color-base-100)'
    }}
    onMouseLeave={(e) => {
      if (!isCurrent)
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
    }}
    onClick={() => {
      if (!isCurrent) onSelect(app)
    }}
  >
    <span
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        backgroundColor: 'var(--modus-wc-color-base-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={app.icon} decorative size="sm" />
    </span>
    <span
      style={{
        fontSize: '11px',
        lineHeight: '14px',
        textAlign: 'center',
        color: isCurrent
          ? 'var(--modus-wc-color-primary)'
          : 'var(--modus-wc-color-base-content)',
        wordBreak: app.id === 'photogrammetry' ? 'break-all' : 'keep-all',
        overflowWrap: app.id === 'photogrammetry' ? 'break-word' : 'normal',
        maxWidth: '72px',
      }}
    >
      {app.name}
    </span>
  </button>
)

// ── V1: flat 3-column grid ────────────────────────────────────────────────────
const AppSwitcherV1 = ({ pathname, onSelect }: { pathname: string; onSelect: (app: AppEntry) => void }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 80px)',
      gap: '4px',
    }}
  >
    {APPS.filter((app) => !V2_ONLY_IDS.includes(app.id)).map((app) => (
      <AppTile key={app.id} app={app} isCurrent={isActiveApp(app, pathname)} onSelect={onSelect} />
    ))}
  </div>
)

// ── V2: grouped by suite ──────────────────────────────────────────────────────
const AppSwitcherV2 = ({ pathname, onSelect }: { pathname: string; onSelect: (app: AppEntry) => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {V2_GROUPS.map((group) => (
      <div key={group.title}>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast)',
          }}
        >
          {group.title}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 80px)',
            gap: '4px',
          }}
        >
          {group.apps.map((app) => (
            <AppTile key={app.id} app={app} isCurrent={isActiveApp(app, pathname)} onSelect={onSelect} />
          ))}
        </div>
      </div>
    ))}
  </div>
)

// ── Panel shell ───────────────────────────────────────────────────────────────
export const AppSwitcher = ({ open, onClose, anchorRef }: AppSwitcherProps) => {
  const { config } = useAppConfig()
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSelect = (app: AppEntry) => {
    if (app.url) {
      const worksMatch = pathname.match(/^\/project\/(.+)/)
      const connectMatch = pathname.match(/^\/connect\/project\/(.+)/)
      const projectId = worksMatch?.[1] || connectMatch?.[1]

      if (projectId) {
        const projectUrl = app.id === 'connect'
          ? `/connect/project/${projectId}`
          : `/project/${projectId}`
        navigate(projectUrl)
      } else {
        navigate(app.url)
      }
    }
    onClose()
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: '56px',
        right: '8px',
        zIndex: 9999,
        backgroundColor: 'var(--modus-wc-color-base-page)',
        border: '1px solid var(--modus-wc-color-base-200)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px 0 rgba(54,53,69,0.15)',
        padding: '16px',
        minWidth: '296px',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content)',
          }}
        >
          All Apps
        </span>
        <button
          onClick={onClose}
          aria-label="Close app switcher"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            color: 'var(--modus-wc-color-base-content-low-contrast)',
          }}
        >
          <Icon name="close" decorative size="sm" />
        </button>
      </div>

      {config.appSwitcherVariant === 'v1'
        ? <AppSwitcherV1 pathname={pathname} onSelect={handleSelect} />
        : <AppSwitcherV2 pathname={pathname} onSelect={handleSelect} />}
    </div>
  )
}
