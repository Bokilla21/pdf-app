import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchInvites()
  }, [])

  async function fetchInvites() {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })
    setInvites(data || [])
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
      <button onClick={generateInvite} disabled={loading} style={{ marginBottom: 32, padding: '8px 20px' }}>
        {loading ? 'Generišem...' : '+ Generiši invite link'}
      </button>

      <h3 style={{ marginBottom: 12 }}>Aktivni linkovi ({aktivni.length})</h3>
      {aktivni.length === 0 && <p style={{ color: '#888', marginBottom: 24 }}>Nema aktivnih linkova.</p>}
      {aktivni.map(inv => (
        <div key={inv.id} style={{ padding: 12, border: '1px solid #c3e6cb', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fff4' }}>
          <p style={{ fontSize: 13, color: '#2d6a4f' }}>{inv.token}</p>
          <button onClick={() => copyLink(inv.token)}>Kopiraj link</button>
        </div>
      ))}

      <h3 style={{ marginBottom: 12, marginTop: 32 }}>Iskorišćeni linkovi ({iskorisceni.length})</h3>
      {iskorisceni.length === 0 && <p style={{ color: '#888' }}>Nema iskorišćenih linkova.</p>}
      {iskorisceni.map(inv => (
        <div key={inv.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8, background: '#f9f9f9' }}>
          <p style={{ fontSize: 13, color: '#888' }}>{inv.token}</p>
          <p style={{ fontSize: 12, color: '#aaa' }}>Iskorišćen</p>
        </div>
      ))}
    </div>
  )
}