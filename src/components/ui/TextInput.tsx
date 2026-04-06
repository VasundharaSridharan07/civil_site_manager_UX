import { ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react'

export interface TextInputProps {
  label?: string
  value?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  errorText?: string
  helperText?: string
  /** Set to true for inline editing (no border) */
  borderless?: boolean
  onChange?: (value: string) => void
}

export const TextInput = ({
  label,
  value = '',
  placeholder,
  disabled = false,
  required = false,
  errorText,
  helperText,
  borderless = false,
  onChange,
}: TextInputProps) => (
  <ModusWcTextInput
    label={label}
    value={value}
    placeholder={placeholder}
    disabled={disabled}
    required={required}
    feedback={
      errorText
        ? { level: 'error', message: errorText }
        : helperText
          ? { level: 'info', message: helperText }
          : undefined
    }
    bordered={!borderless}
    onInputChange={(e: CustomEvent) => {
      const newValue = e.detail?.target?.value || ''
      onChange?.(newValue)
    }}
  />
)
