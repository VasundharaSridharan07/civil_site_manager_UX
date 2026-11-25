// Static timeline schedule data for the 3D-viewer Timeline panel.
// All pixel values (bar left/width, marker offsets, axis day spacing) are taken
// directly from the Figma design (node 468:39979, file lG7deQCYGt89KaY96eVdoL)
// so the panel renders as a pixel-perfect replica.

/** Horizontal pixels per day on the timeline axis. */
export const DAY_WIDTH = 50.71

/** Left padding before the first axis day label (matches Figma). */
const AXIS_LABEL_OFFSET = 4

/** Track-row geometry (px). */
export const ROW_HEIGHT = 40
export const HEADER_HEIGHT = 32
export const BAR_HEIGHT = 28
export const BAR_TOP = 5

/** Color of the schedule-bar text label. */
export const BAR_LABEL_COLOR = '#474655'

export type BarColorKey = 'A' | 'B' | 'C'

/** Fill + border tokens for each schedule-bar color. */
export const BAR_COLORS: Record<BarColorKey, { bg: string; border: string }> = {
  A: { bg: '#e8f3ff', border: '#00509f' },
  B: { bg: '#e2f3de', border: '#329e3e' },
  C: { bg: '#fddee8', border: '#c72e4f' },
}

/** Device/marker icon keys mapping to files in /public/timeline-icons/. */
export type TimelineIcon = 'excavator' | 'compactor' | 'dozer' | 'surface' | 'photo'

export interface TimelineBar {
  color: BarColorKey
  label: string
  /** Left offset in px from the start of the track. */
  left: number
  /** Bar width in px. */
  width: number
}

export interface TimelineRow {
  id: string
  /** group = section header (no track content); device = schedule bars; marker = icon boxes. */
  kind: 'group' | 'device' | 'marker'
  label: string
  /** Icon shown in the device list (and inside marker boxes for marker rows). */
  icon?: TimelineIcon
  /** Schedule bars for device rows. */
  bars?: TimelineBar[]
  /** Left offsets (px) of the 24x24 icon boxes for marker rows. */
  markers?: number[]
}

/** Axis day labels with their absolute left offset in px. */
export const AXIS_DAYS: { label: string; left: number }[] = Array.from(
  { length: 29 },
  (_, i) => ({ label: `${i + 1} Jan`, left: AXIS_LABEL_OFFSET + i * DAY_WIDTH }),
)

/** Ordered timeline rows. Each row maps 1:1 to a device-list row and a track row. */
export const TIMELINE_ROWS: TimelineRow[] = [
  { id: 'excavators', kind: 'group', label: 'Excavators' },
  {
    id: 'exc01',
    kind: 'device',
    label: 'Excavator 01',
    icon: 'excavator',
    bars: [
      { color: 'A', label: 'Design A', left: 0, width: 302 },
      { color: 'B', label: 'Design B', left: 304, width: 708 },
    ],
  },
  {
    id: 'exc02',
    kind: 'device',
    label: 'Excavator 02',
    icon: 'excavator',
    bars: [
      { color: 'A', label: 'Design A', left: 101, width: 404 },
      { color: 'B', label: 'Design B', left: 558, width: 404 },
    ],
  },
  {
    id: 'exc03',
    kind: 'device',
    label: 'Excavator 03',
    icon: 'excavator',
    bars: [
      { color: 'A', label: 'Design A', left: 254, width: 353 },
      { color: 'C', label: 'Design C', left: 862, width: 353 },
    ],
  },
  {
    id: 'exc04',
    kind: 'device',
    label: 'Excavator 04',
    icon: 'excavator',
    bars: [{ color: 'A', label: 'Design A', left: 152, width: 302 }],
  },
  {
    id: 'exc05',
    kind: 'device',
    label: 'Excavator 05',
    icon: 'excavator',
    bars: [{ color: 'A', label: 'Design A', left: 456, width: 353 }],
  },
  { id: 'compactors', kind: 'group', label: 'Compactors' },
  {
    id: 'cmp01',
    kind: 'device',
    label: 'Compactor 01',
    icon: 'compactor',
    bars: [{ color: 'A', label: 'Design A', left: 355, width: 1012 }],
  },
  {
    id: 'cmp02',
    kind: 'device',
    label: 'Compactor 02',
    icon: 'compactor',
    bars: [
      { color: 'A', label: 'Design A', left: 0, width: 302 },
      { color: 'B', label: 'Design B', left: 432, width: 404 },
    ],
  },
  { id: 'dozers', kind: 'group', label: 'Dozers' },
  {
    id: 'dzr5000',
    kind: 'device',
    label: 'Bulldozer 5000 Series',
    icon: 'dozer',
    bars: [
      { color: 'A', label: 'Design A', left: 0, width: 657 },
      { color: 'B', label: 'Design B', left: 659, width: 404 },
    ],
  },
  {
    id: 'dzr7000',
    kind: 'device',
    label: 'Bulldozer 7000 Series',
    icon: 'dozer',
    bars: [{ color: 'A', label: 'Design A', left: 152, width: 302 }],
  },
  {
    id: 'surfaces',
    kind: 'marker',
    label: 'Surveyed Surfaces',
    icon: 'surface',
    markers: [152, 247, 440, 650],
  },
  {
    id: 'ortho',
    kind: 'marker',
    label: 'Ortho Images',
    icon: 'photo',
    markers: [101, 330, 516, 1051],
  },
]

/** Total width of the track content area (px), used to size the scroll region. */
export const TRACKS_WIDTH = 1480
