import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

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
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    setIsAdmin(data?.is_admin || false)
  }

  if (!session) return <Login />

  return (
    <div>
      {isAdmin && (
        <div style={{ background: '#f5f5f5', padding: '8px 24px', display: 'flex', gap: 16 }}>
          <button onClick={() => setPage('dashboard')} style={{ fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontWeight: page === 'dashboard' ? 700 : 400 }}>Moji fajlovi</button>
          <button onClick={() => setPage('admin')} style={{ fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontWeight: page === 'admin' ? 700 : 400 }}>Admin panel</button>
        </div>
      )}
      {page === 'admin' && isAdmin ? <Admin /> : <Dashboard session={session} />}
    </div>
  )
}