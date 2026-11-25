import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'
import { Icon } from '../ui'
import { SITE_CENTER, BOUNDARY } from '../../data/projectBoundary'

const BORDER = '#e0e1e9'
const CONTENT_TEXT = '#252631'
const SUBTLE_TEXT = '#6a6976'

const TERRAIN_SOURCE_ID = 'terrain-dem'

// Restrict the elevation DEM to the project boundary plus a 5-mile buffer.
// Outside this bbox no DEM tiles are fetched, so terrain elevation falls back
// to flat (sea level), giving a "3D inside the AOI, 2D everywhere else" look.
const TERRAIN_BUFFER_MILES = 5
const MILES_PER_DEG_LAT = 69
const computeTerrainBounds = (): [number, number, number, number] => {
  const lats = BOUNDARY.map(([lat]) => lat)
  const lngs = BOUNDARY.map(([, lng]) => lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const centerLat = (minLat + maxLat) / 2

  const latBuffer = TERRAIN_BUFFER_MILES / MILES_PER_DEG_LAT
  const lngBuffer =
    TERRAIN_BUFFER_MILES /
    (MILES_PER_DEG_LAT * Math.cos((centerLat * Math.PI) / 180))

  return [
    minLng - lngBuffer,
    minLat - latBuffer,
    maxLng + lngBuffer,
    maxLat + latBuffer,
  ]
}

const buildStyle = (): StyleSpecification => ({
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    },
    [TERRAIN_SOURCE_ID]: {
      type: 'raster-dem',
      tiles: [
        'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 15,
      encoding: 'terrarium',
      bounds: computeTerrainBounds(),
    },
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-imagery',
    },
    {
      id: 'hillshade',
      type: 'hillshade',
      source: TERRAIN_SOURCE_ID,
      paint: {
        'hillshade-exaggeration': 0.5,
      },
    },
  ],
})

const boundaryGeoJSON = (): GeoJSON.Feature<GeoJSON.Polygon> => {
  const ring = BOUNDARY.map(([lat, lng]) => [lng, lat])
  ring.push(ring[0])
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
  }
}

interface Project3DCanvasProps {
  terrainVisible: boolean
}

export const Project3DCanvas = ({ terrainVisible }: Project3DCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const styleLoadedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(),
      center: [SITE_CENTER[1], SITE_CENTER[0]],
      zoom: 15.5,
      pitch: 45,
      bearing: 0,
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      styleLoadedRef.current = true

      if (!map.getSource('site-boundary')) {
        map.addSource('site-boundary', {
          type: 'geojson',
          data: boundaryGeoJSON(),
        })
      }

      if (!map.getLayer('site-boundary-line')) {
        map.addLayer({
          id: 'site-boundary-line',
          type: 'line',
          source: 'site-boundary',
          paint: {
            'line-color': '#22e0ff',
            'line-width': 2.5,
            'line-dasharray': [3, 2],
          },
        })
      }

      try {
        map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.5 })
      } catch {
        // terrain optional; ignore failures
      }
    })

    return () => {
      styleLoadedRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return

    try {
      if (terrainVisible) {
        map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.5 })
      } else {
        map.setTerrain(null)
      }
    } catch {
      // ignore
    }

    if (map.getLayer('hillshade')) {
      map.setLayoutProperty(
        'hillshade',
        'visibility',
        terrainVisible ? 'visible' : 'none',
      )
    }
  }, [terrainVisible])

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Top-center toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '2px',
          backgroundColor: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: '6px',
          padding: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.10)',
          zIndex: 5,
        }}
      >
        <ToolButton icon="cursor" label="Select" active />
        <ToolButton icon="hand_pointer" label="Pan" />
        <ToolButton icon="ruler" label="Measure" />
        <ToolButton icon="polygon" label="Polygon" />
        <ToolButton icon="line" label="Line" />
        <ToolButton icon="point" label="Point" />
        <ToolButton icon="more_vertical" label="More" />
      </div>

      {/* Bottom-left Satellite mini-tile */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          width: '76px',
          backgroundColor: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.10)',
          zIndex: 5,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '52px',
            background:
              'linear-gradient(135deg, #5a7a55 0%, #3d5a3a 50%, #2c4528 100%)',
          }}
        />
        <div
          style={{
            padding: '4px 6px',
            fontSize: '11px',
            fontWeight: 600,
            color: CONTENT_TEXT,
            textAlign: 'center',
          }}
        >
          Satellite
        </div>
      </div>

      {/* Bottom-right orientation gizmo */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          width: '64px',
          height: '64px',
          backgroundColor: 'rgba(255,255,255,0.92)',
          border: `1px solid ${BORDER}`,
          borderRadius: '50%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Orientation"
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="20" fill="none" stroke={BORDER} strokeWidth="1" />
          <polygon points="24,6 27,22 24,20 21,22" fill="#d04545" />
          <polygon points="24,42 27,26 24,28 21,26" fill={SUBTLE_TEXT} />
          <text
            x="24"
            y="13"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill={CONTENT_TEXT}
            fontFamily="sans-serif"
          >
            N
          </text>
          <text
            x="24"
            y="40"
            textAnchor="middle"
            fontSize="8"
            fontWeight="600"
            fill={SUBTLE_TEXT}
            fontFamily="sans-serif"
          >
            S
          </text>
          <text
            x="6"
            y="27"
            textAnchor="middle"
            fontSize="8"
            fontWeight="600"
            fill={SUBTLE_TEXT}
            fontFamily="sans-serif"
          >
            W
          </text>
          <text
            x="42"
            y="27"
            textAnchor="middle"
            fontSize="8"
            fontWeight="600"
            fill={SUBTLE_TEXT}
            fontFamily="sans-serif"
          >
            E
          </text>
        </svg>
      </div>
    </div>
  )
}

const ToolButton = ({
  icon,
  label,
  active,
}: {
  icon: string
  label: string
  active?: boolean
}) => (
  <button
    aria-label={label}
    title={label}
    style={{
      width: '28px',
      height: '28px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: active ? '#eef0ff' : 'transparent',
      color: active ? '#0063a3' : SUBTLE_TEXT,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      transition: 'background-color 100ms',
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.backgroundColor = '#f5f5fa'
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    <Icon name={icon} decorative size="sm" />
  </button>
)
