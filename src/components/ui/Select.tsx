import { ModusWcSelect } from '@trimble-oss/moduswebcomponents-react'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SelectProps {
  label?: string
  options: SelectOption[]
  value?: string
  disabled?: boolean
  required?: boolean
  /** Error text shown below the select */
  errorText?: string
  /** Helper text shown below the select */
  helperText?: string
  onChange?: (value: string) => void
}

export const Select = ({
  label,
  options,
  value = '',
  disabled = false,
  required = false,
  errorText,
  helperText,
  onChange,
}: SelectProps) => (
  <ModusWcSelect
    label={label}
    options={options}
    value={value}
    disabled={disabled}
    required={required}
    feedback={
      errorText
        ? { level: 'error', message: errorText }
        : helperText
          ? { level: 'info', message: helperText }
          : undefined
    }
    onInputChange={(e: CustomEvent) => {
      const newValue = e.detail?.target?.value || ''
      onChange?.(newValue)
    }}
  />
)
