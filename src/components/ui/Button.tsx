import { ModusWcButton } from '@trimble-oss/moduswebcomponents-react'

/** Visual style of the button — maps to Modus `variant` */
export type ButtonVariant = 'filled' | 'outlined' | 'borderless'
/** Semantic color of the button — maps to Modus `color` */
export type ButtonColor = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'
export type ButtonShape = 'default' | 'square' | 'circle'

export interface ButtonProps {
  children: React.ReactNode
  /** Visual style. Defaults to "filled". Use "outlined" for secondary/tertiary actions. */
  variant?: ButtonVariant
  /** Semantic color. Defaults to "tertiary". */
  color?: ButtonColor
  size?: ButtonSize
  shape?: ButtonShape
  /** Toggle state — use for icon buttons that represent an active selection. */
  pressed?: boolean
  disabled?: boolean
  /** Required for icon-only buttons (shape="square") */
  ariaLabel?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export const Button = ({
  children,
  variant = 'filled',
  color = 'tertiary',
  size = 'md',
  shape = 'default',
  pressed,
  disabled = false,
  ariaLabel,
  onClick,
  type = 'button',
}: ButtonProps) => (
  <ModusWcButton
    variant={variant}
    color={color}
    size={size}
    shape={shape === 'default' ? 'rectangle' : shape}
    pressed={pressed}
    disabled={disabled}
    aria-label={ariaLabel}
    type={type}
    onButtonClick={onClick}
  >
    {children}
  </ModusWcButton>
)
