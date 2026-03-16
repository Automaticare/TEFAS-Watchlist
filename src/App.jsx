import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Watchlist from './pages/Watchlist'
import FundDetail from './pages/FundDetail'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import './index.css'

function AppContent() {
  const { user } = useAuth()

  return (
    <>
      {user && (
        <header style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text)' }}>
            <h1 style={{ fontSize: '24px', margin: 0 }}>TEFAS Watchlist</h1>
          </Link>
        </header>
      )}
      <main style={{ padding: '24px 0' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
          <Route path="/fund/:fundCode" element={<ProtectedRoute><FundDetail /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
