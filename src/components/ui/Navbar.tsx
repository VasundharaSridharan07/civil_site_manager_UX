import { useRef, useState } from 'react'
import { ModusWcNavbar, ModusWcThemeSwitcher } from '@trimble-oss/moduswebcomponents-react'
import { AppSwitcher } from '../AppSwitcher'
import { Button } from './Button'
import { Icon } from './Icon'

export interface NavbarProps {
  appName: string
  showThemeSwitcher?: boolean
  userName?: string
  userEmail?: string
  children?: React.ReactNode
}

export const Navbar = ({
  appName,
  showThemeSwitcher = true,
  userName = '',
  userEmail = '',
  children,
}: NavbarProps) => {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const appsButtonRef = useRef<HTMLSpanElement>(null)

  return (
    <>
      <ModusWcNavbar
        userCard={{
          name: userName,
          email: userEmail,
          myTrimbleButton: 'Configurations',
        }}
        visibility={{
          user: !!userName,
          search: false,
          help: false,
          apps: false,
          notifications: false,
          mainMenu: false,
        }}
        onMyTrimbleClick={() => {
          window.open('/config', '_blank')
        }}
      >
        <div
          slot="start"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}
        >
        <span
          style={{
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content)',
            fontSize: '1.125rem',
          }}
        >
          {appName}
        </span>
        </div>
        {children}
        <div
          slot="end"
          style={{ display: 'flex', alignItems: 'center', gap: '0' }}
        >
          {showThemeSwitcher && <ModusWcThemeSwitcher />}
          <Button variant="borderless" color="tertiary" shape="square" ariaLabel="Search">
            <Icon name="search" decorative size="sm" />
          </Button>
          <Button variant="borderless" color="tertiary" shape="square" ariaLabel="Help">
            <Icon name="help" decorative size="sm" />
          </Button>
          <span ref={appsButtonRef}>
            <Button
              variant="borderless"
              color="tertiary"
              shape="square"
              ariaLabel="Apps"
              pressed={switcherOpen}
              onClick={() => setSwitcherOpen((v) => !v)}
            >
              <Icon name="apps" decorative size="sm" />
            </Button>
          </span>
        </div>
      </ModusWcNavbar>

      <AppSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        anchorRef={appsButtonRef}
      />
    </>
  )
}
