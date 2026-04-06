import { ModusWcCard } from '@trimble-oss/moduswebcomponents-react'
import { Typography } from './Typography'

export interface CardProps {
  children: React.ReactNode
  /** Optional header title rendered in the card's header slot */
  header?: string
  className?: string
  layout?: 'vertical' | 'horizontal'
  padding?: 'normal' | 'compact'
}

export const Card = ({ children, header, className, layout, padding = 'normal' }: CardProps) => (
  <ModusWcCard bordered={false} layout={layout} padding={padding} customClass={className}>
    {header && (
      <div slot="header" style={{ padding: 'var(--padding-card)' }}>
        <Typography hierarchy="h3" size="lg">
          {header}
        </Typography>
      </div>
    )}
    <div style={{ padding: 'var(--padding-card)' }}>{children}</div>
  </ModusWcCard>
)
