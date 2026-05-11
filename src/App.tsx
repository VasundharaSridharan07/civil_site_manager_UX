import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppConfigProvider } from './context/AppConfigContext'
import { Navbar } from './components/ui'
import { Home } from './pages/Home'
import { WorksProjectDetail } from './pages/WorksProjectDetail'
import { ConfigPage } from './pages/ConfigPage'
import { ConnectHome } from './pages/ConnectHome'
import { ConnectProjectDetail } from './pages/ConnectProjectDetail'

const WorksLayout = () => (
  <div
    style={{
      minHeight: '100vh',
      backgroundColor: 'var(--modus-wc-color-base-page)',
    }}
  >
    <Navbar
      appName="Works+"
      userName="Vasundhara Sridharan"
      userEmail="vs@trimble.com"
      showThemeSwitcher
    />
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<WorksProjectDetail />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </main>
  </div>
)

const App = () => (
  <AppConfigProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/connect" element={<ConnectHome />} />
        <Route path="/connect/project/:id" element={<ConnectProjectDetail />} />
        <Route path="/*" element={<WorksLayout />} />
      </Routes>
    </BrowserRouter>
  </AppConfigProvider>
)

export default App
