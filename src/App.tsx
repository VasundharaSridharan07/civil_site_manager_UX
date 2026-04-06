import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/ui'
import { Home } from './pages/Home'

const App = () => (
  <BrowserRouter>
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--modus-wc-color-base-page)',
      }}
    >
      <Navbar
        appName="Civil Site Manager"
        userName="VS User"
        userEmail="vs@trimble.com"
        showThemeSwitcher
      />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  </BrowserRouter>
)

export default App
