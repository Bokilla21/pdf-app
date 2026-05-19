import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [invites, setInvites] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('korisnici')

  useEffect(() => {
    fetchInvites()
    fetchUsers()
  }, [])

  async function fetchInvites() {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })
    setInvites(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function generateInvite() {
    setLoading(true)
    const token = crypto.randomUUID()
    await supabase.from('invites').insert({ token })
    await fetchInvites()
    setLoading(false)
  }

  function copyLink(token) {
    const link = `${window.location.origin}?invite=${token}`
    navigator.clipboard.writeText(link)
    alert('Link kopiran!')
  }

  const aktivni = invites.filter(i => !i.used)
  const iskorisceni = invites.filter(i => i.used)

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Admin panel</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab('korisnici')} style={{ fontWeight: tab === 'korisnici' ? 700 : 400, padding: '8px 16px' }}>Korisnici</button>
        <button onClick={() => setTab('invites')} style={{ fontWeight: tab === 'invites' ? 700 : 400, padding: '8px 16px' }}>Invite linkovi</button>
      </div>

      {tab === 'korisnici' && (
        <div>
          <p style={{ color: '#888', marginBottom: 16, fontSize: 13 }}>Ukupno korisnika: {users.length}</p>
          {users.map(u => (
            <div key={u.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>{u.id}</p>
                <p style={{ fontSize: 12, color: u.is_admin ? 'green' : '#888' }}>{u.is_admin ? 'Admin' : 'Korisnik'}</p>
              </div>
              <p style={{ fontSize: 12, color: '#aaa' }}>{new Date(u.created_at).toLocaleDateString('sr-RS')}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'invites' && (
        <div>
          <button onClick={generateInvite} disabled={loading} style={{ marginBottom: 24, padding: '8px 20px' }}>
            {loading ? 'Generišem...' : '+ Generiši invite link'}
          </button>
          <h3 style={{ marginBottom: 12 }}>Aktivni ({aktivni.length})</h3>
          {aktivni.length === 0 && <p style={{ color: '#888', marginBottom: 24 }}>Nema aktivnih linkova.</p>}
          {aktivni.map(inv => (
            <div key={inv.id} style={{ padding: 12, border: '1px solid #c3e6cb', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fff4' }}>
              <p style={{ fontSize: 13, color: '#2d6a4f' }}>{inv.token}</p>
              <button onClick={() => copyLink(inv.token)}>Kopiraj link</button>
            </div>
          ))}
          <h3 style={{ marginBottom: 12, marginTop: 24 }}>Iskorišćeni ({iskorisceni.length})</h3>
          {iskorisceni.length === 0 && <p style={{ color: '#888' }}>Nema iskorišćenih.</p>}
          {iskorisceni.map(inv => (
            <div key={inv.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8, background: '#f9f9f9' }}>
              <p style={{ fontSize: 13, color: '#888' }}>{inv.token}</p>
              <p style={{ fontSize: 12, color: '#aaa' }}>Iskorišćen</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}