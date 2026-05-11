import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'csm_app_config'

export interface AppConfig {
  appSwitcherVariant: 'v1' | 'v2'
  // Add future config flags here
}

const defaults: AppConfig = {
  appSwitcherVariant: 'v1',
}

function loadFromStorage(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

interface AppConfigContextValue {
  config: AppConfig
  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void
}

const AppConfigContext = createContext<AppConfigContextValue>({
  config: defaults,
  setConfig: () => {},
})

export const AppConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfigState] = useState<AppConfig>(loadFromStorage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const setConfig = useCallback(<K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfigState((prev) => ({ ...prev, [key]: value }))
  }, [])

  return (
    <AppConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </AppConfigContext.Provider>
  )
}

export const useAppConfig = () => useContext(AppConfigContext)
