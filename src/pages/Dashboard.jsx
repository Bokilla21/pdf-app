import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Dashboard({ session }) {
  const [files, setFiles] = useState([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data } = await supabase.from('files').select('*')
    setFiles(data || [])
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const path = `${session.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('pdfs').upload(path, file)
    if (!error) {
      await supabase.from('files').insert({
        name: file.name,
        size: file.size,
        owner_id: session.user.id,
        storage_path: path
      })
      fetchFiles()
    }
    setUploading(false)
  }

  async function openFile(f) {
    const { data } = await supabase.storage.from('pdfs').createSignedUrl(f.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2>PDF biblioteka</h2>
        <button onClick={handleLogout}>Odjavi se</button>
      </div>
      <input
        placeholder="Pretraži fajlove..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 16 }}
      />
      <label style={{ display: 'inline-block', padding: '8px 16px', border: '1px solid #ccc', cursor: 'pointer', marginBottom: 24 }}>
        {uploading ? 'Učitavanje...' : 'Dodaj PDF'}
        <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
      </label>
      <div>
        {filtered.length === 0 && <p style={{ color: '#888' }}>Nema fajlova.</p>}
        {filtered.map(f => (
          <div key={f.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 500 }}>{f.name}</p>
              <p style={{ fontSize: 13, color: '#888' }}>{Math.round(f.size / 1024)} KB</p>
            </div>
            <button onClick={() => openFile(f)}>Otvori</button>
          </div>
        ))}
      </div>
    </div>
  )
}