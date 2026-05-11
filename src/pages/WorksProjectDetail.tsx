import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Icon } from '../components/ui'
import { WorksSidebar } from '../components/WorksSidebar'
import { PROJECTS } from '../data/projects'
import { DEVICES } from '../data/devices'
import type { Device } from '../data/devices'

/* ── Palette ── */
const BORDER = '#e0e1e9'
const HEADER_BG = '#f1f1f6'
const SELECTED_BG = 'rgba(0, 99, 163, 0.07)'
const SELECTED_BORDER = '#006daf'
const LINK_COLOR = '#0063a3'
const STATUS_GREEN_BG = '#e7f5ec'
const STATUS_GREEN_TEXT = '#1a7a3a'
const SUBTLE_TEXT = '#6a6976'
const CONTENT_TEXT = '#252631'

/* ───────────────────────── DeviceInfoPanel ───────────────────────── */

const DeviceInfoPanel = ({
  device,
  onClose,
}: {
  device: Device
  onClose: () => void
}) => (
  <aside
    style={{
      width: '300px',
      minWidth: '300px',
      borderLeft: `1px solid ${BORDER}`,
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 56px)',
      overflowY: 'auto',
    }}
  >
    {/* Header row */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px 0',
      }}
    >
      <span style={{ fontSize: '11px', fontWeight: 600, color: SUBTLE_TEXT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Device Details
      </span>
      <button
        onClick={onClose}
        aria-label="Close panel"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          color: SUBTLE_TEXT,
          display: 'flex',
          alignItems: 'center',
          transition: 'background-color 100ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f1f6' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <Icon name="close" size="sm" decorative />
      </button>
    </div>

    {/* Device avatar + name */}
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 8px' }}>
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #e8f0fe 0%, #d4e4f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3b82b0',
          marginBottom: '12px',
        }}
      >
        <Icon name="devices" decorative size="lg" />
      </div>
      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: CONTENT_TEXT, lineHeight: '22px' }}>
        {device.name}
      </p>
      <p style={{ margin: '2px 0 0', fontSize: '12px', color: SUBTLE_TEXT }}>
        {device.deviceType} &middot; {device.serialNumber}
      </p>
    </div>

    {/* Action bar */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', padding: '8px 16px 16px' }}>
      <ActionButton icon="map_marker" label="Locate" />
      <ActionButton icon="delete" label="Delete" />
      <ActionButton icon="cloud" label="Remote" />
    </div>

    <div style={{ height: '1px', backgroundColor: BORDER, margin: '0 16px' }} />

    {/* Properties */}
    <div style={{ padding: '12px 16px', flex: 1 }}>
      <PropRow label="Active Design" value={device.activeDesign} />
      <PropRow label="Last Reported" value={device.lastReported} />
      <PropRow label="Field Data" value={device.fieldData || '-'} isLink={!!device.fieldData} />
      <PropRow label="Field Software" value={device.fieldSoftware} />
      <PropRow label="Designs Published" value={String(device.designPublished)} hasEdit />
      <PropRow label="Machine Playback" value="View Playback" isLink isBeta />
      <PropRow label="Utilization Report" value="View Report" isLink isBeta />

      <div style={{ marginTop: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: SUBTLE_TEXT,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            marginBottom: '6px',
          }}
        >
          Description
        </label>
        <textarea
          readOnly
          value={device.description}
          rows={2}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: '13px',
            lineHeight: '18px',
            border: `1px solid ${BORDER}`,
            borderRadius: '4px',
            resize: 'vertical',
            backgroundColor: '#fafafa',
            color: CONTENT_TEXT,
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>

    {/* Status banner */}
    <div
      style={{
        margin: '12px 16px 16px',
        padding: '10px 14px',
        backgroundColor: STATUS_GREEN_BG,
        border: `1px solid #c6e6d0`,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <span style={{ color: STATUS_GREEN_TEXT, display: 'flex', flexShrink: 0 }}>
        <Icon name="info" decorative size="sm" />
      </span>
      <div>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: STATUS_GREEN_TEXT, lineHeight: '16px' }}>
          Status
        </p>
        <p style={{ margin: '1px 0 0', fontSize: '11px', color: STATUS_GREEN_TEXT, opacity: 0.85, lineHeight: '15px' }}>
          {device.statusMessage}
        </p>
      </div>
    </div>
  </aside>
)

const ActionButton = ({ icon, label }: { icon: string; label: string }) => (
  <button
    aria-label={label}
    title={label}
    style={{
      background: 'none',
      border: `1px solid ${BORDER}`,
      borderRadius: '6px',
      cursor: 'pointer',
      padding: '7px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      color: SUBTLE_TEXT,
      fontSize: '11px',
      fontWeight: 500,
      transition: 'all 100ms',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f5f5fa'
      e.currentTarget.style.borderColor = '#c5c6d0'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.borderColor = BORDER
    }}
  >
    <Icon name={icon} decorative size="sm" />
    {label}
  </button>
)

const PropRow = ({
  label,
  value,
  isLink,
  isBeta,
  hasEdit,
}: {
  label: string
  value: string
  isLink?: boolean
  isBeta?: boolean
  hasEdit?: boolean
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '7px 0',
      borderBottom: `1px solid #f0f0f5`,
      gap: '12px',
    }}
  >
    <span style={{ fontSize: '12px', color: SUBTLE_TEXT, whiteSpace: 'nowrap' }}>
      {label}
    </span>
    <span
      style={{
        fontSize: '12px',
        fontWeight: 500,
        color: isLink ? LINK_COLOR : CONTENT_TEXT,
        cursor: isLink ? 'pointer' : 'default',
        textAlign: 'right',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {isLink ? (
        <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>{value}</span>
      ) : (
        value
      )}
      {isBeta && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 600,
            backgroundColor: '#eef0ff',
            color: '#5b6abf',
            padding: '1px 5px',
            borderRadius: '3px',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            lineHeight: '14px',
          }}
        >
          Beta
        </span>
      )}
      {hasEdit && (
        <span style={{ cursor: 'pointer', color: SUBTLE_TEXT, display: 'flex' }}>
          <Icon name="edit" decorative size="sm" />
        </span>
      )}
    </span>
  </div>
)

/* ───────────────────────── Main Page ───────────────────────── */

export const WorksProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('devices')
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(DEVICES[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const project = useMemo(() => PROJECTS.find((p) => p.id === id), [id])
  const projectName = project?.name ?? 'Project'

  const filteredDevices = useMemo(
    () =>
      DEVICES.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.description.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )

  const selectedDevice = useMemo(
    () => DEVICES.find((d) => d.id === selectedDeviceId) ?? null,
    [selectedDeviceId],
  )

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      <WorksSidebar
        projectName={projectName}
        activeId={activeNav}
        onSelect={setActiveNav}
        onMyProjects={() => navigate('/')}
      />

      {/* Center content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#f7f7fa',
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            padding: '10px 24px',
            fontSize: '12px',
            color: SUBTLE_TEXT,
            backgroundColor: '#fff',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{ cursor: 'pointer', color: LINK_COLOR }}
            onClick={() => navigate('/')}
          >
            Projects
          </span>
          <Icon name="chevron_right" decorative size="sm" />
          <span
            style={{ cursor: 'pointer', color: LINK_COLOR }}
            onClick={() => navigate(`/project/${id}`)}
          >
            {projectName}
          </span>
          <Icon name="chevron_right" decorative size="sm" />
          <span style={{ fontWeight: 600, color: CONTENT_TEXT }}>Devices</span>
        </div>

        {/* Toolbar area */}
        <div
          style={{
            padding: '16px 24px 12px',
            backgroundColor: '#fff',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: CONTENT_TEXT,
                  letterSpacing: '0.02em',
                }}
              >
                Devices
              </h2>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#eef0ff',
                  color: '#5b6abf',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  lineHeight: '18px',
                }}
              >
                {filteredDevices.length}
              </span>
            </div>
            <Button color="primary" size="sm">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="add" decorative size="sm" />
                Add Device
              </span>
            </Button>
          </div>

          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: `1px solid ${BORDER}`,
                borderRadius: '4px',
                padding: '0 10px',
                backgroundColor: '#fafafa',
                width: '240px',
                transition: 'border-color 120ms',
              }}
            >
              <Icon name="search" decorative size="sm" />
              <input
                type="text"
                placeholder="Search by name or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  padding: '7px 0',
                  fontSize: '13px',
                  backgroundColor: 'transparent',
                  color: CONTENT_TEXT,
                  width: '100%',
                }}
              />
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: BORDER, margin: '0 4px' }} />

            {/* View toggles */}
            <ToolbarToggle
              icon="list"
              label="List view"
              active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            />
            <ToolbarToggle
              icon="view_grid"
              label="Grid view"
              active={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            />

            <div style={{ width: '1px', height: '24px', backgroundColor: BORDER, margin: '0 4px' }} />

            <Button variant="borderless" color="tertiary" shape="square" ariaLabel="Export">
              <Icon name="download" decorative size="sm" />
            </Button>
          </div>
        </div>

        {/* Table area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              backgroundColor: '#fff',
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                <Th style={{ width: '40px', paddingLeft: '24px' }}>
                  <input
                    type="checkbox"
                    style={{ accentColor: '#0063a3' }}
                    checked={filteredDevices.length > 0 && filteredDevices.every((d) => d.id === selectedDeviceId)}
                    readOnly
                  />
                </Th>
                <Th>Device Name</Th>
                <Th>Description</Th>
                <Th>Active Design</Th>
                <Th>Last Reported</Th>
                <Th style={{ width: '80px', textAlign: 'center' }}>Remote</Th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  selected={device.id === selectedDeviceId}
                  onClick={() => setSelectedDeviceId(device.id)}
                />
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      color: SUBTLE_TEXT,
                      fontSize: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Icon name="search" decorative size="lg" />
                      <p style={{ margin: 0 }}>No devices match your search</p>
                      <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Try adjusting your search terms</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer count */}
          <div
            style={{
              padding: '10px 24px',
              fontSize: '12px',
              color: SUBTLE_TEXT,
              borderTop: `1px solid ${BORDER}`,
              backgroundColor: '#fff',
            }}
          >
            Showing {filteredDevices.length} of {DEVICES.length} devices
          </div>
        </div>
      </div>

      {/* Right panel */}
      {selectedDevice && (
        <DeviceInfoPanel
          device={selectedDevice}
          onClose={() => setSelectedDeviceId(null)}
        />
      )}
    </div>
  )
}

/* ───────────────────────── Subcomponents ───────────────────────── */

const ToolbarToggle = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) => (
  <button
    aria-label={label}
    title={label}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      border: `1px solid ${active ? SELECTED_BORDER : 'transparent'}`,
      borderRadius: '4px',
      backgroundColor: active ? SELECTED_BG : 'transparent',
      color: active ? SELECTED_BORDER : SUBTLE_TEXT,
      cursor: 'pointer',
      transition: 'all 100ms',
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.backgroundColor = '#f1f1f6'
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    <Icon name={icon} decorative size="sm" />
  </button>
)

const Th = ({
  children,
  style,
}: {
  children?: React.ReactNode
  style?: React.CSSProperties
}) => (
  <th
    style={{
      padding: '10px 14px',
      fontWeight: 600,
      fontSize: '11px',
      color: SUBTLE_TEXT,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      textAlign: 'left',
      backgroundColor: HEADER_BG,
      position: 'sticky',
      top: 0,
      zIndex: 1,
      ...style,
    }}
  >
    {children}
  </th>
)

const DeviceRow = ({
  device,
  selected,
  onClick,
}: {
  device: Device
  selected: boolean
  onClick: () => void
}) => {
  const [hovered, setHovered] = useState(false)
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        backgroundColor: selected
          ? SELECTED_BG
          : hovered
            ? '#fafafd'
            : 'transparent',
        borderBottom: `1px solid ${BORDER}`,
        borderLeft: selected ? `3px solid ${SELECTED_BORDER}` : '3px solid transparent',
        transition: 'background-color 80ms ease',
      }}
    >
      <Td style={{ paddingLeft: '21px' }}>
        <input
          type="checkbox"
          checked={selected}
          readOnly
          style={{ accentColor: '#0063a3' }}
        />
      </Td>
      <Td style={{ fontWeight: 600 }}>{device.name}</Td>
      <Td style={{ color: SUBTLE_TEXT }}>{device.description || '-'}</Td>
      <Td>
        {device.activeDesign !== '-' ? (
          <span style={{ color: CONTENT_TEXT }}>{device.activeDesign}</span>
        ) : (
          <span style={{ color: '#b8b8c4' }}>—</span>
        )}
      </Td>
      <Td style={{ fontSize: '12px', color: SUBTLE_TEXT }}>{device.lastReported !== '-' ? device.lastReported : <span style={{ color: '#b8b8c4' }}>—</span>}</Td>
      <Td style={{ textAlign: 'center' }}>
        {device.remote && (
          <span style={{ color: STATUS_GREEN_TEXT }}>
            <Icon name="check_circle" decorative size="sm" />
          </span>
        )}
      </Td>
    </tr>
  )
}

const Td = ({
  children,
  style,
}: {
  children?: React.ReactNode
  style?: React.CSSProperties
}) => (
  <td
    style={{
      padding: '11px 14px',
      color: CONTENT_TEXT,
      fontSize: '13px',
      ...style,
    }}
  >
    {children}
  </td>
)
