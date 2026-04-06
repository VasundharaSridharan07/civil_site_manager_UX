import { ModusWcTypography } from '@trimble-oss/moduswebcomponents-react'

export type TypographyHierarchy = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'
export type TypographySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type TypographyWeight = 'light' | 'normal' | 'semibold' | 'bold'

export interface TypographyProps {
  children: React.ReactNode
  hierarchy?: TypographyHierarchy
  size?: TypographySize
  weight?: TypographyWeight
  color?: string
  className?: string
}

export const Typography = ({
  children,
  hierarchy = 'p',
  size,
  weight,
  color = 'var(--modus-wc-color-base-content)',
  className,
}: TypographyProps) => (
  <ModusWcTypography
    hierarchy={hierarchy}
    size={size}
    weight={weight}
    style={{ color }}
    customClass={className}
  >
    {children}
  </ModusWcTypography>
)
