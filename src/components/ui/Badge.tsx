import { ModusWcBadge } from '@trimble-oss/moduswebcomponents-react'

export type BadgeColor = 'primary' | 'secondary' | 'tertiary' | 'high-contrast' | 'success' | 'warning' | 'danger'
export type BadgeVariant = 'counter' | 'filled' | 'outlined' | 'text'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  size?: BadgeSize
  variant?: BadgeVariant
}

export const Badge = ({
  children,
  color = 'primary',
  size = 'md',
  variant = 'filled',
}: BadgeProps) => (
  <ModusWcBadge color={color} size={size} variant={variant}>
    {children}
  </ModusWcBadge>
)
