import { useEffect, useId } from 'react'
import { ModusWcModal } from '@trimble-oss/moduswebcomponents-react'
import { Button } from './Button'

export interface ModalProps {
  open: boolean
  title?: string
  primaryActionText?: string
  secondaryActionText?: string
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  onClose?: () => void
  children?: React.ReactNode
}

export const Modal = ({
  open,
  title,
  primaryActionText,
  secondaryActionText,
  onPrimaryAction,
  onSecondaryAction,
  onClose,
  children,
}: ModalProps) => {
  const uid = useId().replace(/:/g, '')
  const modalId = `modal-${uid}`

  useEffect(() => {
    const dialog = document.getElementById(modalId) as HTMLDialogElement | null
    if (!dialog) return
    const handleClose = () => onClose?.()
    dialog.addEventListener('close', handleClose)
    if (open) {
      dialog.showModal?.()
    } else {
      dialog.close?.()
    }
    return () => dialog.removeEventListener('close', handleClose)
  }, [open, modalId, onClose])

  return (
    <ModusWcModal
      modalId={modalId}
      showClose
      backdrop="default"
    >
      {title && <span slot="header">{title}</span>}
      <div slot="content">{children}</div>
      {(primaryActionText || secondaryActionText) && (
        <div slot="footer" className="flex gap-2 justify-end">
          {secondaryActionText && (
            <Button color="tertiary" variant="outlined" onClick={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
          {primaryActionText && (
            <Button color="primary" onClick={onPrimaryAction}>
              {primaryActionText}
            </Button>
          )}
        </div>
      )}
    </ModusWcModal>
  )
}
