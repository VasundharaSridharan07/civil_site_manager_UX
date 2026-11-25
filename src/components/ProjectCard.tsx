import { Icon } from './ui'

export interface ProjectCardProps {
  name: string
  account?: string
  imageUrl: string
  onClick?: () => void
}

const resolveAssetUrl = (url: string) => {
  if (/^(?:[a-z][a-z\d+\-.]*:|\/\/)/i.test(url)) return url
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/${url.replace(/^\//, '')}`
}

/**
 * Project thumbnail card — 312×360px with image hero and text footer.
 * Matches Figma node I201:1238 spec exactly.
 */
export const ProjectCard = ({ name, account, imageUrl, onClick }: ProjectCardProps) => (
  <div
    className="project-card"
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    style={{
      width: '100%',
      backgroundColor: 'var(--modus-wc-color-base-page)',
      border: '1px solid var(--modus-wc-color-base-100)',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    {/* Image hero — aspect-ratio 4:3 scales with the column width */}
    <div
      style={{
        width: '100%',
        aspectRatio: '4 / 3',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: 'var(--modus-wc-color-base-200)',
      }}
    >
      <img
        src={resolveAssetUrl(imageUrl)}
        alt={name}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>

    {/* Info footer */}
    <div
      style={{
        padding: '16px 8px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        letterSpacing: '0.15px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: '24px',
            color: 'var(--modus-wc-color-base-content)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: '1 1 0',
            minWidth: 0,
          }}
        >
          {name}
        </p>
        <button
          aria-label="More options"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: 'var(--modus-wc-color-base-content-low-contrast)',
            flexShrink: 0,
          }}
        >
          <Icon name="more_vertical" size="sm" decorative />
        </button>
      </div>
      {account && (
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 700,
            lineHeight: '24px',
            color: 'var(--modus-wc-color-base-content-low-contrast)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {account}
        </p>
      )}
    </div>
  </div>
)
