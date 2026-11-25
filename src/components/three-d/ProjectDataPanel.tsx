import { useEffect, useRef, useState } from 'react'
import { Icon } from '../ui'

const BORDER = '#e0e1e9'
const SUBTLE_TEXT = '#6a6976'
const CONTENT_TEXT = '#252631'
const HOVER_BG = '#f5f5fa'
const PILL_BG = '#f1f1f6'

interface TreeNode {
  id: string
  label: string
  children?: TreeLeaf[]
}

interface TreeLeaf {
  id: string
  label: string
}

const TREE: TreeNode[] = [
  { id: 'designs', label: 'Designs', children: [] },
  { id: 'surveyed', label: 'Surveyed Surfaces', children: [] },
  { id: 'ortho', label: 'Ortho-images', children: [] },
  {
    id: 'terrain',
    label: '3D Terrain',
    children: [{ id: 'terrain-default', label: 'Terrain default' }],
  },
]

interface ProjectDataPanelProps {
  terrainVisible: boolean
  onToggleTerrain: () => void
  onOpenTimeline: () => void
}

export const ProjectDataPanel = ({
  terrainVisible,
  onToggleTerrain,
  onOpenTimeline,
}: ProjectDataPanelProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    terrain: true,
  })
  const [menu, setMenu] = useState<{
    id: string
    top: number
    left: number
  } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const menuItemsFor = (rowId: string): string[] =>
    rowId === 'terrain-default' ? ['Filter', 'Download'] : []

  const openMenu = (rowId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (menu?.id === rowId) {
      setMenu(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenu({ id: rowId, top: rect.bottom + 4, left: rect.left })
  }

  useEffect(() => {
    if (!menu) return
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menu])

  const menuItems = menu ? menuItemsFor(menu.id) : []

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#fff',
        borderRight: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 12px 8px',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 700,
            color: CONTENT_TEXT,
            letterSpacing: '0.02em',
          }}
        >
          Project Data
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <HeaderIconButton ariaLabel="Add" icon="add" />
          <HeaderIconButton ariaLabel="Sort" icon="sort" />
          <HeaderIconButton ariaLabel="Search" icon="search" />
        </div>
      </div>

      {/* Filter pill */}
      <div style={{ padding: '10px 12px 4px' }}>
        <button
          aria-label="Change filter"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            border: `1px solid ${BORDER}`,
            borderRadius: '14px',
            backgroundColor: PILL_BG,
            color: CONTENT_TEXT,
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '16px',
          }}
        >
          <span>Everything in project</span>
          <Icon name="expand_more" decorative size="xs" />
        </button>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {TREE.map((node) => {
          const isOpen = !!expanded[node.id]
          const hasChildren = !!node.children && node.children.length > 0
          return (
            <div key={node.id}>
              <Row>
                <button
                  onClick={() => toggle(node.id)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 0 6px 12px',
                    border: 'none',
                    background: 'transparent',
                    color: CONTENT_TEXT,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '14px',
                      color: SUBTLE_TEXT,
                    }}
                  >
                    <Icon
                      name={isOpen ? 'expand_more' : 'chevron_right'}
                      decorative
                      size="xs"
                    />
                  </span>
                  <span style={{ flex: 1 }}>{node.label}</span>
                </button>
                <KebabButton onClick={(e) => openMenu(node.id, e)} />
              </Row>
              {hasChildren && isOpen && (
                <div>
                  {node.children!.map((leaf) => (
                    <Row key={leaf.id} paddingLeft="32px">
                      <span
                        style={{
                          flex: 1,
                          fontSize: '12px',
                          color: CONTENT_TEXT,
                        }}
                      >
                        {leaf.label}
                      </span>
                      {leaf.id === 'terrain-default' ? (
                        <button
                          onClick={onToggleTerrain}
                          aria-label={
                            terrainVisible ? 'Hide terrain' : 'Show terrain'
                          }
                          title={
                            terrainVisible ? 'Hide terrain' : 'Show terrain'
                          }
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: terrainVisible ? CONTENT_TEXT : '#b8b8c4',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Icon
                            name={
                              terrainVisible ? 'visibility_on' : 'visibility_off'
                            }
                            decorative
                            size="sm"
                          />
                        </button>
                      ) : null}
                      <KebabButton onClick={(e) => openMenu(leaf.id, e)} />
                    </Row>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {menu && menuItems.length > 0 && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: menu.top,
            left: menu.left,
            minWidth: '120px',
            backgroundColor: '#fff',
            border: `1px solid ${BORDER}`,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '4px 0',
            zIndex: 1000,
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item}
              role="menuitem"
              onClick={() => {
                if (item === 'Filter') onOpenTimeline()
                setMenu(null)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eef0f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              style={{
                width: '100%',
                display: 'block',
                textAlign: 'left',
                padding: '8px 14px',
                border: 'none',
                background: 'transparent',
                color: CONTENT_TEXT,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}

const Row = ({
  children,
  paddingLeft,
}: {
  children: React.ReactNode
  paddingLeft?: string
}) => (
  <div
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = HOVER_BG
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      paddingRight: '8px',
      paddingLeft: paddingLeft ?? 0,
      transition: 'background-color 100ms',
    }}
  >
    {children}
  </div>
)

const KebabButton = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) => (
  <button
    aria-label="More options"
    title="More options"
    onClick={onClick}
    style={{
      width: '24px',
      height: '24px',
      flexShrink: 0,
      border: 'none',
      borderRadius: '4px',
      background: 'transparent',
      color: SUBTLE_TEXT,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#e9e9f0'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    <Icon name="more_vertical" decorative size="sm" />
  </button>
)

const HeaderIconButton = ({
  ariaLabel,
  icon,
}: {
  ariaLabel: string
  icon: string
}) => (
  <button
    aria-label={ariaLabel}
    title={ariaLabel}
    style={{
      width: '24px',
      height: '24px',
      border: 'none',
      borderRadius: '4px',
      background: 'transparent',
      color: SUBTLE_TEXT,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = HOVER_BG
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    <Icon name={icon} decorative size="sm" />
  </button>
)
