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

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Admin panel</h2>
      <button onClick={generateInvite} disabled={loading} style={{ marginBottom: 24, padding: '8px 20px' }}>
        {loading ? 'Generišem...' : '+ Generiši invite link'}
      </button>
      <div>
        {invites.map(inv => (
          <div key={inv.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: 13 }}>{inv.token}</p>
              <p style={{ fontSize: 12, color: inv.used ? 'green' : '#888' }}>{inv.used ? 'Iskorišćen' : 'Aktivan'}</p>
            </div>
            {!inv.used && (
              <button onClick={() => copyLink(inv.token)}>Kopiraj link</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}