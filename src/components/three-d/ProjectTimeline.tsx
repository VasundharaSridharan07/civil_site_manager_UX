import { Button, Checkbox, Icon } from '../ui'
import {
  AXIS_DAYS,
  BAR_COLORS,
  BAR_HEIGHT,
  BAR_LABEL_COLOR,
  BAR_TOP,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  TIMELINE_ROWS,
  TRACKS_WIDTH,
  type TimelineRow,
} from '../../data/timeline'

const BORDER = '#e2e4e8'
const PANEL_HEADER_TEXT = '#212936'
const AXIS_HEADER_BG = '#f7f8fa'
const AXIS_TEXT = '#5c6673'
const MARKER_BORDER = '#dcdcdc'
const TOOLBAR_ACTIVE_BG = '#e8f3ff'
const TOOLBAR_ACTIVE_FG = '#00509f'
const DEVICE_LIST_WIDTH = 260
const TOOLBAR_WIDTH = 32
const ICON_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/timeline-icons`

interface ProjectTimelineProps {
  onClose: () => void
}

const TOOLBAR_BUTTONS: { icon: string; label: string; active?: boolean }[] = [
  { icon: 'layer', label: 'Layers', active: true },
  { icon: 'cube', label: '3D' },
  { icon: 'download', label: 'Download' },
]

export const ProjectTimeline = ({ onClose }: ProjectTimelineProps) => {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderTop: `1px solid ${BORDER}`,
        borderLeft: `1px solid ${BORDER}`,
        borderRight: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <TimelineHeader onClose={onClose} />
      <div
        style={{
          display: 'flex',
          flex: '1 1 0',
          minHeight: 0,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Toolbar />
        <DeviceList />
        <Tracks />
      </div>
    </div>
  )
}

const TimelineHeader = ({ onClose }: { onClose: () => void }) => (
  <div
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      height: '44px',
      minHeight: '44px',
      padding: '0 12px',
      borderBottom: `1px solid ${BORDER}`,
      overflow: 'hidden',
    }}
  >
    {/* Top centered drag handle bar */}
    <div
      style={{
        position: 'absolute',
        top: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '24px',
        height: '2px',
        borderRadius: '4px',
        backgroundColor: '#eaeaef',
      }}
    />

    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        color: AXIS_TEXT,
      }}
    >
      <Icon name="drag_indicator" decorative size="sm" />
    </span>

    <p
      style={{
        margin: 0,
        fontFamily: "'Open Sans', sans-serif",
        fontWeight: 600,
        fontSize: '16px',
        color: PANEL_HEADER_TEXT,
        whiteSpace: 'nowrap',
      }}
    >
      Timeline
    </p>

    {/* Date range chip */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '32px',
        padding: '6px 10px',
        border: `1px solid ${BORDER}`,
        borderRadius: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '14px',
          height: '14px',
          color: PANEL_HEADER_TEXT,
        }}
      >
        <Icon name="calendar_clock" decorative size="xs" />
      </span>
      <span style={{ fontSize: '14px', color: PANEL_HEADER_TEXT }}>
        Jan 10, 2026 12:00am&nbsp;&nbsp;&ndash;&nbsp;&nbsp;Jan 29, 2026 12:00am
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '12px',
          height: '12px',
          color: PANEL_HEADER_TEXT,
        }}
      >
        <Icon name="caret_down" decorative size="xs" />
      </span>
    </div>

    {/* Spacer */}
    <div style={{ flex: '1 1 0', minWidth: 0 }} />

    <Button variant="outlined" color="tertiary" size="sm">
      Save
    </Button>
    <Button variant="filled" color="primary" size="sm" disabled>
      Apply
    </Button>

    <HeaderIconButton icon="full_screen" label="Full screen" />
    <HeaderIconButton icon="close" label="Close timeline" onClick={onClose} />
  </div>
)

const HeaderIconButton = ({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick?: () => void
}) => (
  <button
    aria-label={label}
    title={label}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6px',
      border: 'none',
      borderRadius: '4px',
      background: 'transparent',
      color: AXIS_TEXT,
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f1f1f6'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    <Icon name={icon} decorative size="sm" />
  </button>
)

const Toolbar = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      width: `${TOOLBAR_WIDTH}px`,
      minWidth: `${TOOLBAR_WIDTH}px`,
      height: '100%',
      borderRight: `1px solid ${BORDER}`,
    }}
  >
    {TOOLBAR_BUTTONS.map((btn) => (
      <button
        key={btn.label}
        aria-label={btn.label}
        title={btn.label}
        style={{
          width: '24px',
          height: '24px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: btn.active ? TOOLBAR_ACTIVE_BG : 'transparent',
          color: btn.active ? TOOLBAR_ACTIVE_FG : AXIS_TEXT,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!btn.active) e.currentTarget.style.backgroundColor = '#f1f1f6'
        }}
        onMouseLeave={(e) => {
          if (!btn.active) e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <Icon name={btn.icon} decorative size="xs" />
      </button>
    ))}
  </div>
)

const DeviceList = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: `${DEVICE_LIST_WIDTH}px`,
      minWidth: `${DEVICE_LIST_WIDTH}px`,
      height: '100%',
      backgroundColor: '#fff',
      borderRight: `1px solid ${BORDER}`,
      overflow: 'hidden',
    }}
  >
    {/* Devices header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: `${HEADER_HEIGHT}px`,
        width: '100%',
        padding: '0 12px',
        backgroundColor: AXIS_HEADER_BG,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 600,
          fontSize: '12px',
          color: AXIS_TEXT,
          whiteSpace: 'nowrap',
        }}
      >
        Devices
      </p>
    </div>

    {TIMELINE_ROWS.map((row) => (
      <DeviceRow key={row.id} row={row} />
    ))}
  </div>
)

const DeviceRow = ({ row }: { row: TimelineRow }) => {
  const isChild = row.kind === 'device'
  const semibold = row.kind !== 'device'
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: `${ROW_HEIGHT}px`,
          width: '100%',
          paddingLeft: isChild ? '28px' : '8px',
          paddingRight: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '20px',
            flexShrink: 0,
          }}
        >
          <Checkbox checked />
        </div>
        {row.icon && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
              flexShrink: 0,
            }}
          >
            <img
              src={`${ICON_BASE}/${row.icon}.svg`}
              alt=""
              style={{
                maxWidth: '16px',
                maxHeight: '16px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
        <span
          style={{
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: semibold ? 600 : 400,
            fontSize: '13px',
            color: PANEL_HEADER_TEXT,
            whiteSpace: 'nowrap',
          }}
        >
          {row.label}
        </span>
      </div>
      <Separator />
    </>
  )
}

const Tracks = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      flex: '1 1 0',
      minWidth: 0,
      height: '100%',
      backgroundColor: '#fff',
      overflow: 'hidden',
    }}
  >
    {/* Axis header */}
    <div
      style={{
        position: 'relative',
        height: `${HEADER_HEIGHT}px`,
        width: '100%',
        backgroundColor: AXIS_HEADER_BG,
        borderBottom: `1px solid ${BORDER}`,
        overflow: 'hidden',
      }}
    >
      {AXIS_DAYS.map((day) => (
        <span
          key={day.label}
          style={{
            position: 'absolute',
            left: `${day.left}px`,
            top: '8px',
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 400,
            fontSize: '10px',
            color: AXIS_TEXT,
            whiteSpace: 'nowrap',
          }}
        >
          {day.label}
        </span>
      ))}
    </div>

    {TIMELINE_ROWS.map((row) => (
      <TrackRow key={row.id} row={row} />
    ))}
  </div>
)

const TrackRow = ({ row }: { row: TimelineRow }) => (
  <>
    <div
      style={{
        position: 'relative',
        height: `${ROW_HEIGHT}px`,
        width: `${TRACKS_WIDTH}px`,
        minWidth: `${TRACKS_WIDTH}px`,
        flexShrink: 0,
      }}
    >
      {row.bars?.map((bar, i) => {
        const colors = BAR_COLORS[bar.color]
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${bar.left}px`,
              top: `${BAR_TOP}px`,
              width: `${bar.width}px`,
              height: `${BAR_HEIGHT}px`,
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '7px',
                top: '3px',
                fontFamily: "'Open Sans', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '20px',
                color: BAR_LABEL_COLOR,
                whiteSpace: 'nowrap',
              }}
            >
              {bar.label}
            </span>
          </div>
        )
      })}
      {row.markers?.map((left, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: '8px',
            width: '24px',
            height: '24px',
            border: `1px solid ${MARKER_BORDER}`,
            borderRadius: '4px',
            padding: '4px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {row.icon && (
            <img
              src={`${ICON_BASE}/${row.icon}.svg`}
              alt=""
              style={{
                maxWidth: '16px',
                maxHeight: '16px',
                objectFit: 'contain',
              }}
            />
          )}
        </div>
      ))}
    </div>
    <Separator />
  </>
)

const Separator = () => (
  <div
    style={{
      height: '1px',
      width: '100%',
      backgroundColor: BORDER,
      flexShrink: 0,
    }}
  />
)
