import { ModusWcNavbar, ModusWcThemeSwitcher } from '@trimble-oss/moduswebcomponents-react'

export interface NavbarProps {
  appName: string
  showThemeSwitcher?: boolean
  /** Full name used to derive the user avatar (e.g. "Vijay Sridha" → shows "VS") */
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
}: NavbarProps) => (
  <ModusWcNavbar
    userCard={{ name: userName, email: userEmail }}
    visibility={{
      user: !!userName,
      search: true,
      help: true,
      apps: true,
      notifications: false,
      mainMenu: false,
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
    {showThemeSwitcher && (
      <div slot="end">
        <ModusWcThemeSwitcher />
      </div>
    )}
  </ModusWcNavbar>
)
