import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  async function handleRegister() {
    const token = new URLSearchParams(window.location.search).get('invite')
    if (!token) { setError('Potreban je invite link za registraciju'); return }
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()
    if (!data) { setError('Nevažeći ili iskorišćen invite'); return }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); return }
    await supabase.from('invites').update({ used: true }).eq('token', token)
    setMsg('Nalog napravljen! Prijavi se.')
  }

  const hasInvite = new URLSearchParams(window.location.search).get('invite')

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a3a6b', padding: '24px 32px', borderRadius: '12px 12px 0 0', width: 360, display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/assets/mlogo.jpg" alt="Delta Auto Group" style={{ height: 44, borderRadius: 6 }} />
        <div>
          <p style={{ color: '#ffffff', fontWeight: 600, fontSize: 15, margin: 0 }}>Delta Auto Group</p>
          <p style={{ color: '#a0bcd8', fontSize: 12, margin: 0 }}>PDF Biblioteka</p>
        </div>
      </div>
      <div style={{ background: '#ffffff', padding: 32, borderRadius: '0 0 12px 12px', width: 360, boxShadow: '0 4px 24px rgba(26,58,107,0.12)' }}>
        {error && <p style={{ color: '#c0392b', marginBottom: 12, fontSize: 13 }}>{error}</p>}
        {msg && <p style={{ color: '#27ae60', marginBottom: 12, fontSize: 13 }}>{msg}</p>}
        <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Email</label>
        <input
          placeholder="vas@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 16, padding: '9px 12px', border: '1px solid #d0dce8', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />
        <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Lozinka</label>
        <input
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 24, padding: '9px 12px', border: '1px solid #d0dce8', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />
        <button
          onClick={handleLogin}
          style={{ width: '100%', padding: '10px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer', marginBottom: hasInvite ? 8 : 0 }}>
          Prijavi se
        </button>
        {hasInvite && (
          <button
            onClick={handleRegister}
            style={{ width: '100%', padding: '10px', background: '#4a90c4', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
            Registruj se
          </button>
        )}
      </div>
    </div>
  )
}