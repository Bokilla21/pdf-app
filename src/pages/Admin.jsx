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

  async function toggleAdmin(user) {
    if (!confirm(`${user.is_admin ? 'Ukloni' : 'Dodeli'} admin prava za ${user.email}?`)) return
    await supabase.from('profiles').update({ is_admin: !user.is_admin }).eq('id', user.id)
    fetchUsers()
  }

  async function resetPassword(user) {
    if (!confirm(`Pošalji reset lozinke na ${user.email}?`)) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin
    })
    if (!error) alert(`Email za reset lozinke poslat na ${user.email}`)
    else alert('Greška pri slanju emaila')
  }

  async function deleteUser(user) {
    if (!confirm(`Obriši korisnika ${user.email}? Ovo će obrisati i sve njegove fajlove i foldere.`)) return
    const { data: userFiles } = await supabase
      .from('files')
      .select('storage_path')
      .eq('owner_id', user.id)
    if (userFiles && userFiles.length > 0) {
      await supabase.storage.from('pdfs').remove(userFiles.map(f => f.storage_path))
    }
    await supabase.from('files').delete().eq('owner_id', user.id)
    await supabase.from('folders').delete().eq('owner_id', user.id)
    await supabase.from('folder_members').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    fetchUsers()
  }

  async function deleteAllUserFiles(user) {
    if (!confirm(`Obriši sve fajlove korisnika ${user.email}?`)) return
    const { data: userFiles } = await supabase
      .from('files')
      .select('storage_path')
      .eq('owner_id', user.id)
    if (userFiles && userFiles.length > 0) {
      await supabase.storage.from('pdfs').remove(userFiles.map(f => f.storage_path))
    }
    await supabase.from('files').delete().eq('owner_id', user.id)
    alert('Fajlovi obrisani.')
  }

  async function removeFromAllFolders(user) {
    if (!confirm(`Ukloni ${user.email} iz svih foldera?`)) return
    await supabase.from('folder_members').delete().eq('user_id', user.id)
    alert('Korisnik uklonjen iz svih foldera.')
  }

  function copyLink(token) {
    const link = `${window.location.origin}?invite=${token}`
    navigator.clipboard.writeText(link)
    alert('Link kopiran!')
  }

  const aktivni = invites.filter(i => !i.used)
  const iskorisceni = invites.filter(i => i.used)

  return (
    <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 24px' }}>
      <h2 style={{ color: '#1a3a6b', marginBottom: 24 }}>Admin panel</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab('korisnici')}
          style={{ padding: '7px 16px', background: tab === 'korisnici' ? '#1a3a6b' : 'transparent', color: tab === 'korisnici' ? '#fff' : '#1a3a6b', border: '1px solid #d0dce8', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Korisnici ({users.length})
        </button>
        <button onClick={() => setTab('invites')}
          style={{ padding: '7px 16px', background: tab === 'invites' ? '#1a3a6b' : 'transparent', color: tab === 'invites' ? '#fff' : '#1a3a6b', border: '1px solid #d0dce8', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Invite linkovi
        </button>
      </div>

      {tab === 'korisnici' && (
        <div>
          {users.map(u => (
            <div key={u.id} style={{ padding: '14px 16px', background: '#fff', border: '1px solid #d0dce8', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 14, margin: 0, color: '#222' }}>{u.email || u.id}</p>
                  <p style={{ fontSize: 12, margin: 0, marginTop: 2, color: u.is_admin ? '#1a3a6b' : '#888' }}>
                    {u.is_admin ? '⭐ Admin' : 'Korisnik'} · {u.created_at ? new Date(u.created_at).toLocaleDateString('sr-RS') : '—'}
                  </p>
                </div>
                <button onClick={() => toggleAdmin(u)}
                  style={{ padding: '5px 12px', background: u.is_admin ? '#fff3cd' : '#e8f4fd', color: u.is_admin ? '#856404' : '#1a3a6b', border: `1px solid ${u.is_admin ? '#ffc107' : '#4a90c4'}`, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  {u.is_admin ? 'Ukloni admina' : 'Postavi za admina'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => resetPassword(u)}
                  style={{ padding: '5px 12px', background: 'transparent', color: '#4a90c4', border: '1px solid #4a90c4', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  Reset lozinke
                </button>
                <button onClick={() => removeFromAllFolders(u)}
                  style={{ padding: '5px 12px', background: 'transparent', color: '#1a3a6b', border: '1px solid #d0dce8', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  Ukloni iz svih foldera
                </button>
                <button onClick={() => deleteAllUserFiles(u)}
                  style={{ padding: '5px 12px', background: 'transparent', color: '#e67e22', border: '1px solid #f5c0c0', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  Obriši sve fajlove
                </button>
                <button onClick={() => deleteUser(u)}
                  style={{ padding: '5px 12px', background: 'transparent', color: '#c0392b', border: '1px solid #f5c0c0', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  Obriši nalog
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'invites' && (
        <div>
          <button onClick={generateInvite} disabled={loading}
            style={{ marginBottom: 24, padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            {loading ? 'Generišem...' : '+ Generiši invite link'}
          </button>

          <h3 style={{ marginBottom: 12, color: '#1a3a6b', fontSize: 15 }}>Aktivni ({aktivni.length})</h3>
          {aktivni.length === 0 && <p style={{ color: '#888', marginBottom: 24, fontSize: 13 }}>Nema aktivnih linkova.</p>}
          {aktivni.map(inv => (
            <div key={inv.id} style={{ padding: '12px 16px', border: '1px solid #c3e6cb', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fff4' }}>
              <p style={{ fontSize: 13, color: '#2d6a4f', margin: 0 }}>{inv.token}</p>
              <button onClick={() => copyLink(inv.token)}
                style={{ padding: '6px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                Kopiraj link
              </button>
            </div>
          ))}

          <h3 style={{ marginBottom: 12, marginTop: 24, color: '#888', fontSize: 15 }}>Iskorišćeni ({iskorisceni.length})</h3>
          {iskorisceni.length === 0 && <p style={{ color: '#888', fontSize: 13 }}>Nema iskorišćenih.</p>}
          {iskorisceni.map(inv => (
            <div key={inv.id} style={{ padding: '12px 16px', border: '1px solid #eee', borderRadius: 8, marginBottom: 8, background: '#f9f9f9' }}>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{inv.token}</p>
              <p style={{ fontSize: 12, color: '#aaa', margin: 0, marginTop: 2 }}>Iskorišćen</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}