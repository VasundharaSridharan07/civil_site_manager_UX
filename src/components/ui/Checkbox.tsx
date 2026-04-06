import { ModusWcCheckbox } from '@trimble-oss/moduswebcomponents-react'

export interface CheckboxProps {
  label?: string
  checked?: boolean
  disabled?: boolean
  indeterminate?: boolean
  onChange?: (checked: boolean) => void
}

export const Checkbox = ({
  label,
  checked = false,
  disabled = false,
  indeterminate = false,
  onChange,
}: CheckboxProps) => (
  <ModusWcCheckbox
    label={label}
    value={checked}
    disabled={disabled}
    indeterminate={indeterminate}
    onInputChange={(e: CustomEvent) => {
      onChange?.(e.detail?.target?.checked ?? false)
    }}
  />
)
