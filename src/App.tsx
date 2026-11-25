import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppConfigProvider } from './context/AppConfigContext'
import { Navbar } from './components/ui'
import { Home } from './pages/Home'
import { WorksProjectDetail } from './pages/WorksProjectDetail'
import { Project3DViewer } from './pages/Project3DViewer'
import { ConfigPage } from './pages/ConfigPage'
import { ConnectHome } from './pages/ConnectHome'

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
        <Route path="/project/:id/3d-viewer" element={<Project3DViewer />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </main>
  </div>
)

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

const App = () => (
  <AppConfigProvider>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/connect" element={<ConnectHome />} />
        <Route path="/*" element={<WorksLayout />} />
      </Routes>
    </BrowserRouter>
  </AppConfigProvider>
)

export default App
