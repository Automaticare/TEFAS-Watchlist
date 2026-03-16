import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Watchlist from './pages/Watchlist'
import FundDetail from './pages/FundDetail'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <header style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>TEFAS Watchlist</h1>
        </Link>
      </header>
      <main style={{ padding: '24px 0' }}>
        <Routes>
          <Route path="/" element={<Watchlist />} />
          <Route path="/fund/:fundCode" element={<FundDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
