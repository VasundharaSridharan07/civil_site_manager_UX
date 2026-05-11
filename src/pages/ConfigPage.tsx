import { useState } from 'react'
import { useAppConfig, type AppConfig } from '../context/AppConfigContext'
import { Button } from '../components/ui'

interface VariantOption<T extends string> {
  value: T
  label: string
  description: string
}

interface ConfigSectionProps<T extends string> {
  title: string
  description: string
  options: VariantOption<T>[]
  selected: T
  onChange: (value: T) => void
}

function ConfigSection<T extends string>({
  title,
  description,
  options,
  selected,
  onChange,
}: ConfigSectionProps<T>) {
  return (
    <div
      style={{
        backgroundColor: 'var(--modus-wc-color-base-page)',
        border: '1px solid var(--modus-wc-color-base-200)',
        borderRadius: '8px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content)',
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '13px',
            color: 'var(--modus-wc-color-base-content-low-contrast)',
          }}
        >
          {description}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const isSelected = opt.value === selected
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                flex: '1 1 200px',
                padding: '16px',
                borderRadius: '8px',
                border: isSelected
                  ? '2px solid var(--modus-wc-color-primary)'
                  : '2px solid var(--modus-wc-color-base-200)',
                backgroundColor: isSelected
                  ? 'var(--modus-wc-color-primary-pale, var(--modus-wc-color-base-100))'
                  : 'var(--modus-wc-color-base-page)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 120ms ease, background-color 120ms ease',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isSelected
                    ? 'var(--modus-wc-color-primary)'
                    : 'var(--modus-wc-color-base-content)',
                }}
              >
                {opt.label}
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  color: 'var(--modus-wc-color-base-content-low-contrast)',
                }}
              >
                {opt.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const ConfigPage = () => {
  const { config, setConfig } = useAppConfig()
  const [draft, setDraft] = useState<AppConfig>({ ...config })

  const hasChanges =
    draft.appSwitcherVariant !== config.appSwitcherVariant

  const handleSave = () => {
    for (const key of Object.keys(draft) as (keyof AppConfig)[]) {
      if (draft[key] !== config[key]) {
        setConfig(key, draft[key])
      }
    }
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 400,
            lineHeight: '36px',
            color: 'var(--modus-wc-color-base-content)',
          }}
        >
          App Configuration
        </h2>
        <Button
          color="primary"
          disabled={!hasChanges}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>

      {/* Config sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>

        <ConfigSection
          title="App Switcher"
          description="Choose how the app switcher panel looks when you click the waffle icon in the navbar."
          options={[
            {
              value: 'v1' as const,
              label: 'Version 1 — Flat Grid',
              description: 'Simple icon grid with app name below each tile. Best for small app suites.',
            },
            {
              value: 'v2' as const,
              label: 'Version 2 — Grouped',
              description: 'Apps grouped by suite with section headers. Best for large ecosystems.',
            },
          ]}
          selected={draft.appSwitcherVariant}
          onChange={(v) => setDraft((prev) => ({ ...prev, appSwitcherVariant: v }))}
        />

        {/* Future sections go here */}

      </div>
    </div>
  )
}
