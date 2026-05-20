import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const theme = {
  primary: '#1a3a6b',
  accent: '#4a90c4',
  white: '#ffffff',
  border: '#d0dce8',
}

export default function Folders({ session }) {
  const [folders, setFolders] = useState([])
  const [activeFolder, setActiveFolder] = useState(null)
  const [files, setFiles] = useState([])
  const [users, setUsers] = useState([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFolders()
    fetchUsers()
  }, [])

  async function fetchFolders() {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false })
    console.log('folders:', data, error)
    setFolders(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
    setUsers(data || [])
  }

  async function fetchFiles(folderId) {
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false })
    setFiles(data || [])
  }

  async function createFolder() {
    if (!folderName.trim()) return
    const { data, error } = await supabase
      .from('folders')
      .insert({ name: folderName, is_private: isPrivate, owner_id: session.user.id })
      .select()
      .single()
    console.log('folder data:', data)
    console.log('folder error:', error)
    if (!error && data) {
      if (!isPrivate && selectedUsers.length > 0) {
        const { error: memberError } = await supabase.from('folder_members').insert(
          selectedUsers.map(uid => ({ folder_id: data.id, user_id: uid }))
        )
        console.log('member error:', memberError)
      }
      setFolderName('')
      setIsPrivate(true)
      setSelectedUsers([])
      setShowNewFolder(false)
      fetchFolders()
    }
  }

  async function openFolder(folder) {
    setActiveFolder(folder)
    fetchFiles(folder.id)
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file || !activeFolder) return
    setUploading(true)
    const path = `${session.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('pdfs').upload(path, file)
    if (!error) {
      await supabase.from('files').insert({
        name: file.name,
        size: file.size,
        owner_id: session.user.id,
        storage_path: path,
        folder_id: activeFolder.id
      })
      fetchFiles(activeFolder.id)
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
    fetchFiles(activeFolder.id)
  }

  async function deleteFolder(folder) {
    if (!confirm(`Obriši folder "${folder.name}"?`)) return
    await supabase.from('folders').delete().eq('id', folder.id)
    if (activeFolder?.id === folder.id) setActiveFolder(null)
    fetchFolders()
  }

  function toggleUser(uid) {
    setSelectedUsers(prev =>
      prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid]
    )
  }

  const otherUsers = users.filter(u => u.id !== session.user.id)

  return (
    <div style={{ display: 'flex', gap: 24, minHeight: 600 }}>

      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: theme.primary, fontSize: 16 }}>Folderi</h3>
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            style={{ padding: '5px 12px', background: theme.primary, color: theme.white, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            + Novi
          </button>
        </div>

        {showNewFolder && (
          <div style={{ padding: 16, background: '#f0f4f8', border: `1px solid ${theme.border}`, borderRadius: 8, marginBottom: 16 }}>
            <input
              placeholder="Naziv foldera"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => setIsPrivate(true)}
                style={{ flex: 1, padding: '6px', background: isPrivate ? theme.primary : 'transparent', color: isPrivate ? theme.white : theme.primary, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                🔒 Privatni
              </button>
              <button
                onClick={() => setIsPrivate(false)}
                style={{ flex: 1, padding: '6px', background: !isPrivate ? theme.primary : 'transparent', color: !isPrivate ? theme.white : theme.primary, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                👥 Deljeni
              </button>
            </div>

            {!isPrivate && otherUsers.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 6px' }}>Dodeli pristup:</p>
                {otherUsers.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                    />
                    {u.email || u.id.slice(0, 8)}
                  </label>
                ))}
              </div>
            )}

            <button
              onClick={createFolder}
              style={{ width: '100%', padding: '8px', background: theme.accent, color: theme.white, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Napravi folder
            </button>
          </div>
        )}

        {folders.map(folder => (
          <div
            key={folder.id}
            onClick={() => openFolder(folder)}
            style={{ padding: '10px 14px', background: activeFolder?.id === folder.id ? theme.primary : '#f8fafd', border: `1px solid ${theme.border}`, borderRadius: 8, marginBottom: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: activeFolder?.id === folder.id ? theme.white : '#222' }}>
                {folder.is_private ? '🔒' : '👥'} {folder.name}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: activeFolder?.id === folder.id ? 'rgba(255,255,255,0.7)' : '#888' }}>
                {folder.owner_id === session.user.id ? 'Moj folder' : 'Deljeni'}
              </p>
            </div>
            {folder.owner_id === session.user.id && (
              <button
                onClick={e => { e.stopPropagation(); deleteFolder(folder) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeFolder?.id === folder.id ? 'rgba(255,255,255,0.7)' : '#c0392b', fontSize: 14, padding: '2px 6px' }}>
                ×
              </button>
            )}
          </div>
        ))}

        {folders.length === 0 && (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 24 }}>Nema foldera</p>
        )}
      </div>

      <div style={{ flex: 1 }}>
        {!activeFolder ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#aaa' }}>
            <p style={{ fontSize: 48, margin: 0 }}>📁</p>
            <p style={{ marginTop: 12, fontSize: 15 }}>Odaberi folder</p>
            <p style={{ fontSize: 13, color: '#bbb' }}>Klikni na folder sa leve strane</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: theme.primary }}>{activeFolder.is_private ? '🔒' : '👥'} {activeFolder.name}</h3>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: theme.primary, color: theme.white, borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                {uploading ? 'Učitavanje...' : '+ Dodaj PDF'}
                <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {files.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
                <p style={{ fontSize: 32, margin: 0 }}>📄</p>
                <p style={{ marginTop: 8, fontSize: 14 }}>Folder je prazan</p>
              </div>
            )}

            {files.map(f => (
              <div key={f.id} style={{ padding: '14px 16px', background: '#f8fafd', border: `1px solid ${theme.border}`, borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 42, background: '#fef0f0', border: '1px solid #f5c0c0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#c0392b', fontWeight: 600, flexShrink: 0 }}>PDF</div>
                  <div>
                    <p style={{ fontWeight: 500, margin: 0, fontSize: 14, color: '#222' }}>{f.name}</p>
                    <p style={{ fontSize: 12, color: '#888', margin: 0, marginTop: 2 }}>{Math.round(f.size / 1024)} KB · {new Date(f.created_at).toLocaleDateString('sr-RS')}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openFile(f)} style={{ padding: '6px 12px', background: theme.accent, color: theme.white, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Otvori</button>
                  <button onClick={() => downloadFile(f)} style={{ padding: '6px 12px', background: '#27ae60', color: theme.white, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Preuzmi</button>
                  <button onClick={() => deleteFile(f)} style={{ padding: '6px 12px', background: 'transparent', color: '#c0392b', border: '1px solid #f5c0c0', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Obriši</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}