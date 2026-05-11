import { useParams } from 'react-router-dom'

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div
      className="page-content"
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <p
        style={{
          color: 'var(--modus-wc-color-base-content-low-contrast)',
          fontSize: '14px',
        }}
      >
        Project {id} — layout coming soon
      </p>
    </div>
  )
}
