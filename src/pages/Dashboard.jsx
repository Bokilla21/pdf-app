import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Dashboard({ session }) {
  const [files, setFiles] = useState([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sortBy, setSortBy] = useState('created_at')

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })
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

  async function deleteFile(f) {
    if (!confirm(`Obriši "${f.name}"?`)) return
    await supabase.storage.from('pdfs').remove([f.storage_path])
    await supabase.from('files').delete().eq('id', f.id)
    fetchFiles()
  }

  async function renameFile(f) {
    const newName = prompt('Novo ime:', f.name)
    if (!newName || newName === f.name) return
    await supabase.from('files').update({ name: newName }).eq('id', f.id)
    fetchFiles()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const filtered = files
    .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'size') return b.size - a.size
      return new Date(b.created_at) - new Date(a.created_at)
    })

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2>PDF biblioteka</h2>
        <button onClick={handleLogout}>Odjavi se</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Pretraži fajlove..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: 8 }}>
          <option value="created_at">Po datumu</option>
          <option value="name">Po imenu</option>
          <option value="size">Po veličini</option>
        </select>
      </div>

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
              <p style={{ fontSize: 13, color: '#888' }}>
                {Math.round(f.size / 1024)} KB · {new Date(f.created_at).toLocaleDateString('sr-RS')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openFile(f)}>Otvori</button>
              <button onClick={() => renameFile(f)}>Preimenuj</button>
              <button onClick={() => deleteFile(f)} style={{ color: 'red' }}>Obriši</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}