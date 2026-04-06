export interface ProjectCardProps {
  name: string
  account: string
  imageUrl: string
  onClick?: () => void
}

/**
 * Project thumbnail card — 312×360px with image hero and text footer.
 * Matches Figma node I201:1238 spec exactly.
 */
export const ProjectCard = ({ name, account, imageUrl, onClick }: ProjectCardProps) => (
  <div
    onClick={onClick}
    style={{
      width: '312px',
      height: '360px',
      backgroundColor: 'var(--modus-wc-color-base-100)',
      borderRadius: '8px',
      boxShadow: '0px 0px 2px 0px rgba(54,53,69,0.3)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      cursor: onClick ? 'pointer' : 'default',
      flexShrink: 0,
    }}
  >
    {/* Image hero — fills remaining height above the info footer */}
    <div style={{ flex: '1 0 0', position: 'relative', overflow: 'hidden' }}>
      <img
        src={imageUrl}
        alt={name}
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
        padding: '16px 16px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        letterSpacing: '0.15px',
        flexShrink: 0,
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
        }}
      >
        {name}
      </p>
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
    </div>
  </div>
)
