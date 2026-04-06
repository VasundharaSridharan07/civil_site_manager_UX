import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg'

export interface IconProps {
  /** Modus icon name (e.g. "add", "settings", "home") */
  name: string
  size?: IconSize
  /** Mark as decorative (hidden from screen readers) */
  decorative?: boolean
  ariaLabel?: string
  variant?: 'outlined' | 'solid'
}

export const Icon = ({
  name,
  size = 'md',
  decorative = true,
  ariaLabel,
  variant = 'outlined',
}: IconProps) => (
  <ModusWcIcon
    name={name}
    size={size}
    decorative={decorative}
    aria-label={!decorative ? ariaLabel : undefined}
    variant={variant}
  />
)
