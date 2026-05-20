import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Folders from './pages/Folders'

const theme = {
  primary: '#1a3a6b',
  accent: '#4a90c4',
  white: '#ffffff',
  light: '#f0f4f8',
  border: '#d0dce8',
}

export { theme }

export default function App() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkAdmin(session.user.id)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkAdmin(session.user.id)
    })
  }, [])

  async function checkAdmin(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle()
      if (!error && data) setIsAdmin(data.is_admin || false)
    } catch (e) {
      setIsAdmin(false)
    }
  }

  if (!session) return <Login />

  return (
    <div style={{ minHeight: '100vh', background: theme.primary }}>
      <div style={{ background: '#12285a', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/assets/mlogo.jpg" alt="Delta Auto Group" style={{ height: 40, borderRadius: 6 }} />
          <span style={{ color: theme.white, fontWeight: 600, fontSize: 16, letterSpacing: 0.5 }}>PDF Biblioteka</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setPage('dashboard')}
            style={{ padding: '6px 16px', background: page === 'dashboard' ? theme.accent : 'transparent', color: theme.white, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Moji fajlovi
          </button>
          <button
            onClick={() => setPage('folders')}
            style={{ padding: '6px 16px', background: page === 'folders' ? theme.accent : 'transparent', color: theme.white, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Folderi
          </button>
          {isAdmin && (
            <button
              onClick={() => setPage('admin')}
              style={{ padding: '6px 16px', background: page === 'admin' ? theme.accent : 'transparent', color: theme.white, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Admin panel
            </button>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 1000, margin: '0 auto', background: '#ffffff', minHeight: 'calc(100vh - 64px)', padding: '32px 24px' }}>
        {page === 'admin' && isAdmin && <Admin />}
        {page === 'folders' && <Folders session={session} />}
        {page === 'dashboard' && <Dashboard session={session} />}
      </div>
    </div>
  )
}