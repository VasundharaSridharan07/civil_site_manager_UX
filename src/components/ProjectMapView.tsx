import { useMemo } from 'react'
import { MapContainer, TileLayer, Polygon, Marker } from 'react-leaflet'
import L from 'leaflet'
import { Icon } from './ui'
import { DEVICES } from '../data/devices'
import { SITE_CENTER, BOUNDARY } from '../data/projectBoundary'
import type { LatLng } from '../data/projectBoundary'

const BORDER = '#e0e1e9'
const LINK_COLOR = '#0063a3'
const SUBTLE_TEXT = '#6a6976'
const CONTENT_TEXT = '#252631'

type MarkerStatus = 'active' | 'warning' | 'not_reporting'
const STATUSES: MarkerStatus[] = ['active', 'warning', 'not_reporting']

// TODO: replace with real status derivation when telemetry is wired up.
const statusForDevice = (id: string): MarkerStatus => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return STATUSES[h % STATUSES.length]
}

const DEVICE_POSITIONS: LatLng[] = [
  [36.0394, -115.3155],
  [36.0397, -115.3142],
  [36.0402, -115.3132],
  [36.0392, -115.3118],
  [36.0388, -115.3098],
  [36.0383, -115.3128],
  [36.04, -115.3115],
]

const positionForIndex = (index: number): LatLng =>
  DEVICE_POSITIONS[index % DEVICE_POSITIONS.length]

const MARKER_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/map-markers`
const FALLBACK_ICON_URL = `${MARKER_BASE}/_fallback.svg`

const candidatesFor = (key: string, status: MarkerStatus): string[] => {
  const list = [
    `${MARKER_BASE}/${key}_${status}.svg`,
    `${MARKER_BASE}/${key}_${status} 1.svg`,
  ]
  if (status === 'not_reporting') {
    list.push(
      `${MARKER_BASE}/${key}_notreporting.svg`,
      `${MARKER_BASE}/${key}_notreporting 1.svg`,
    )
  }
  if (key === 'excavator' && status === 'active') {
    list.push(
      `${MARKER_BASE}/exacavator_active.svg`,
      `${MARKER_BASE}/exacavator_active 1.svg`,
    )
  }
  return list.map(encodeURI)
}

const buildDeviceIcon = (iconUrl: string) =>
  L.icon({
    iconUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: 'project-map-marker',
  })

interface ProjectMapViewProps {
  projectName: string
  onProjectsCrumb: () => void
}

export const ProjectMapView = ({
  projectName,
  onProjectsCrumb,
}: ProjectMapViewProps) => {
  const deviceMarkers = useMemo(
    () =>
      DEVICES.map((device, index) => {
        const status = statusForDevice(device.id)
        const key = device.assetType ?? device.deviceType
        const candidates = candidatesFor(key, status)
        return {
          id: device.id,
          label: device.name,
          position: positionForIndex(index),
          status,
          candidates,
          leafletIcon: buildDeviceIcon(candidates[0]),
        }
      }),
    [],
  )

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#f7f7fa',
      }}
    >
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
        <span style={{ cursor: 'pointer', color: LINK_COLOR }} onClick={onProjectsCrumb}>
          Projects
        </span>
        <Icon name="chevron_right" decorative size="sm" />
        <span style={{ color: LINK_COLOR }}>{projectName}</span>
        <Icon name="chevron_right" decorative size="sm" />
        <span style={{ fontWeight: 600, color: CONTENT_TEXT }}>Map</span>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <MapContainer
          center={SITE_CENTER}
          zoom={16}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <Polygon
            positions={BOUNDARY}
            pathOptions={{
              color: '#22e0ff',
              weight: 2.5,
              dashArray: '8 6',
              fillColor: '#22e0ff',
              fillOpacity: 0.05,
            }}
          />
          {deviceMarkers.map((m) => (
            <Marker
              key={m.id}
              position={m.position}
              icon={m.leafletIcon}
              title={m.label}
              eventHandlers={{
                add: (e) => {
                  const img = (e.target as L.Marker).getElement() as HTMLImageElement | null
                  if (!img || img.tagName !== 'IMG') return
                  const queue = m.candidates.slice(1)
                  const handleError = () => {
                    const next = queue.shift()
                    if (next) {
                      img.src = next
                    } else if (img.src !== FALLBACK_ICON_URL) {
                      img.removeEventListener('error', handleError)
                      img.src = FALLBACK_ICON_URL
                    }
                  }
                  img.addEventListener('error', handleError)
                },
              }}
            />
          ))}
        </MapContainer>

        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            gap: '8px',
            zIndex: 500,
          }}
        >
          <MapControlButton ariaLabel="Fullscreen">
            <Icon name="fullscreen" decorative size="sm" />
          </MapControlButton>
          <MapControlButton ariaLabel="Toggle 2D / 3D">
            <span style={{ fontSize: '12px', fontWeight: 700, color: CONTENT_TEXT }}>2D</span>
          </MapControlButton>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 500,
          }}
        >
          <MapControlButton ariaLabel="Collapse panel">
            <Icon name="chevron_double_right" decorative size="sm" />
          </MapControlButton>
        </div>
      </div>
    </div>
  )
}

const MapControlButton = ({
  ariaLabel,
  children,
}: {
  ariaLabel: string
  children: React.ReactNode
}) => (
  <button
    aria-label={ariaLabel}
    title={ariaLabel}
    style={{
      width: '32px',
      height: '32px',
      borderRadius: '4px',
      border: `1px solid ${BORDER}`,
      backgroundColor: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: CONTENT_TEXT,
      boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
      padding: 0,
    }}
  >
    {children}
  </button>
)
