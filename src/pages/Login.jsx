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
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>PDF biblioteka</h2>
      {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
      {msg && <p style={{ color: 'green', marginBottom: 12 }}>{msg}</p>}
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
      />
      <input
        placeholder="Lozinka"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 16, padding: 8 }}
      />
      <button onClick={handleLogin} style={{ marginRight: 10 }}>Prijavi se</button>
      {hasInvite && <button onClick={handleRegister}>Registruj se</button>}
    </div>
  )
}