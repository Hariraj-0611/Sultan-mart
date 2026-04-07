import { useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'

function UserModal({ user, onSave, onClose }) {
  const [form, setForm] = useState(user || { username: '', first_name: '', last_name: '', email: '', phone: '', role: 'cashier', password: '' })
  const f = (field) => ({ value: form[field] || '', onChange: e => setForm({ ...form, [field]: e.target.value }) })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (user?.id) await api.patch(`/auth/users/${user.id}/`, form)
      else await api.post('/auth/users/', form)
      toast.success('User saved')
      onSave()
    } catch (err) { toast.error(JSON.stringify(err.response?.data) || 'Failed') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-5 border-b flex justify-between">
          <h2 className="font-bold text-lg">{user ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">First Name</label><input className="input mt-1" {...f('first_name')} /></div>
            <div><label className="text-sm font-medium">Last Name</label><input className="input mt-1" {...f('last_name')} /></div>
          </div>
          <div><label className="text-sm font-medium">Username *</label><input className="input mt-1" {...f('username')} required /></div>
          <div><label className="text-sm font-medium">Email</label><input className="input mt-1" type="email" {...f('email')} /></div>
          <div><label className="text-sm font-medium">Phone</label><input className="input mt-1" {...f('phone')} /></div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select className="input mt-1" {...f('role')}>
              <option value="cashier">Cashier</option>
            </select>
          </div>
          <div><label className="text-sm font-medium">{user ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input className="input mt-1" type="password" {...f('password')} required={!user} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save User</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null)

  const load = async () => {
    const { data } = await api.get('/auth/users/')
    setUsers(data.results || data)
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (id) => {
    await api.post(`/auth/users/${id}/toggle_active/`)
    load()
  }

  const ROLE_COLORS = {
    admin:   { bg:'#f3e8ff', color:'#7c3aed', label:'Admin' },
    cashier: { bg:'#dcfce7', color:'#16a34a', label:'Cashier' },
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('add')}>
          <Plus size={16} /> Add User
        </button>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Username', 'Role', 'Phone', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3">
                  {(() => { const r = ROLE_COLORS[u.role] || ROLE_COLORS.cashier; return (
                    <span style={{ background:r.bg, color:r.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{r.label}</span>
                  )})()}
                </td>
                <td className="px-4 py-3">{u.phone || '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(u.id)} className={u.is_active ? 'text-green-500' : 'text-gray-400'}>
                    {u.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-500 hover:text-blue-700" onClick={() => setModal(u)}><Edit2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <UserModal user={modal === 'add' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
    </div>
  )
}
