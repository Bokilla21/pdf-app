import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const theme = {
  primary: '#1a3a6b',
  accent: '#4a90c4',
  white: '#ffffff',
  light: '#f0f4f8',
  border: '#d0dce8',
}

const MAX_SIZE = 50 * 1024 * 1024

function FileIcon({ name }) {
  const isPdf = name.endsWith('.pdf')
  const isXls = name.endsWith('.xlsx') || name.endsWith('.xls')
  const isDoc = name.endsWith('.docx') || name.endsWith('.doc')
  const bg = isPdf ? '#fef0f0' : isXls ? '#e8f5e9' : '#e3f2fd'
  const border = isPdf ? '#f5c0c0' : isXls ? '#a5d6a7' : '#90caf9'
  const color = isPdf ? '#c0392b' : isXls ? '#2e7d32' : '#1565c0'
  const label = isPdf ? 'PDF' : isXls ? 'XLS' : 'DOC'
  return (
    <div style={{ width: 36, height: 42, background: bg, border: `1px solid ${border}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color, fontWeight: 600, flexShrink: 0 }}>
      {label}
    </div>
  )
}

export default function Dashboard({ session }) {
  const [files, setFiles] = useState([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', session.user.id)
      .is('folder_id', null)
      .order('created_at', { ascending: false })
    setFiles(data || [])
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setUploadMsg('❌ Fajl je prevelik — maksimalno 50 MB')
      return
    }
    setUploading(true)
    setUploadMsg('')
    const path = `${session.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('pdfs').upload(path, file)
    if (!error) {
      await supabase.from('files').insert({
        name: file.name,
        size: file.size,
        owner_id: session.user.id,
        storage_path: path
      })
      setUploadMsg('✅ Fajl uspešno dodat!')
      setTimeout(() => setUploadMsg(''), 3000)
      fetchFiles()
    } else {
      setUploadMsg('❌ Greška pri uploadu')
    }
    setUploading(false)
  }

  async function openFile(f) {
    const { data } = await supabase.storage.from('pdfs').createSignedUrl(f.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function downloadFile(f) {
    const { data } = await supabase.storage.from('pdfs').createSignedUrl(f.storage_path, 60)
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = f.name
      a.click()
    }
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

  const totalSize = files.reduce((s, f) => s + f.size, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0, color: theme.primary, fontSize: 20 }}>Moji dokumenti</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#888', marginTop: 2 }}>{files.length} fajlova · {(totalSize / 1048576).toFixed(1)} MB</p>
        </div>
        <button onClick={handleLogout}
          style={{ padding: '7px 16px', background: 'transparent', color: theme.primary, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Odjavi se
        </button>
      </div>

      <div style={{ height: 1, background: theme.border, margin: '16px 0 20px' }} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Pretraži fajlove..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 12px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 14 }}
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '9px 12px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 13, color: '#555' }}>
          <option value="created_at">Po datumu</option>
          <option value="name">Po imenu</option>
          <option value="size">Po veličini</option>
        </select>
      </div>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: theme.primary, color: theme.white, borderRadius: 6, cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        {uploading ? 'Učitavanje...' : '+ Dodaj fajl'}
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleUpload} style={{ display: 'none' }} />
      </label>

      {uploadMsg && (
        <div style={{ padding: '10px 14px', background: uploadMsg.startsWith('✅') ? '#f0fff4' : '#fff5f5', border: `1px solid ${uploadMsg.startsWith('✅') ? '#c3e6cb' : '#f5c0c0'}`, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {uploadMsg}
        </div>
      )}

      <div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 64, color: '#aaa' }}>
            <p style={{ fontSize: 48, margin: 0 }}>📄</p>
            <p style={{ marginTop: 12, fontSize: 15 }}>Nema fajlova</p>
            <p style={{ fontSize: 13, color: '#bbb' }}>Klikni "+ Dodaj fajl" da dodaš prvi dokument</p>
          </div>
        )}
        {filtered.map(f => (
          <div key={f.id} style={{ padding: '14px 16px', background: '#f8fafd', border: `1px solid ${theme.border}`, borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileIcon name={f.name} />
              <div>
                <p style={{ fontWeight: 500, margin: 0, fontSize: 14, color: '#222' }}>{f.name}</p>
                <p style={{ fontSize: 12, color: '#888', margin: 0, marginTop: 2 }}>{Math.round(f.size / 1024)} KB · {new Date(f.created_at).toLocaleDateString('sr-RS')}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openFile(f)} style={{ padding: '6px 12px', background: theme.accent, color: theme.white, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Otvori</button>
              <button onClick={() => downloadFile(f)} style={{ padding: '6px 12px', background: '#27ae60', color: theme.white, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Preuzmi</button>
              <button onClick={() => renameFile(f)} style={{ padding: '6px 12px', background: 'transparent', color: theme.primary, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Preimenuj</button>
              <button onClick={() => deleteFile(f)} style={{ padding: '6px 12px', background: 'transparent', color: '#c0392b', border: '1px solid #f5c0c0', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Obriši</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}