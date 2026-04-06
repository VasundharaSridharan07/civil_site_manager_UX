import { ModusWcAlert } from '@trimble-oss/moduswebcomponents-react'

export type ToastVariant = 'success' | 'warning' | 'error' | 'info'

export interface ToastProps {
  title: string
  description?: string
  variant?: ToastVariant
  dismissible?: boolean
  onDismiss?: () => void
}

export const Toast = ({
  title,
  description,
  variant = 'info',
  dismissible = true,
  onDismiss,
}: ToastProps) => (
  <ModusWcAlert
    alertTitle={title}
    alertDescription={description}
    variant={variant}
    dismissible={dismissible}
    onDismissClick={onDismiss}
  />
)
