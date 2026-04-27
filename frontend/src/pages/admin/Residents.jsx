import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/userApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Users, Plus, Search, Trash2, Edit2, X, UserCheck } from 'lucide-react';

const ROLES = ['resident', 'security', 'admin'];
const emptyForm = { name: '', email: '', password: '', role: 'resident', phone: '', flatNumber: '', wing: '' };

const AdminResidents = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('resident');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { role: roleFilter, search };
      const res = await getUsers(params);
      setUsers(res.data.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, search]);

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone||'', flatNumber: u.flatNumber||'', wing: u.wing||'' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        await updateUser(editUser._id, form);
        toast.success('User updated!');
      } else {
        await createUser(form);
        toast.success('User created!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <Layout title="Resident Management">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-title">User Management</h1>
            <p className="section-subtitle">Manage residents, security, and admin accounts</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2.5">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, flat..." className="input-field pl-10 py-2" />
          </div>
          <div className="flex gap-2">
            {['resident','security','admin'].map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${roleFilter === r ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>User</th><th>Contact</th><th>Flat</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-600/30 text-primary-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {u.name?.charAt(0)}
                          </div>
                          <div><p className="font-medium text-white">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                        </div>
                      </td>
                      <td>{u.phone || '—'}</td>
                      <td>{u.wing ? `${u.wing}-${u.flatNumber}` : u.flatNumber || '—'}</td>
                      <td><span className={`badge ${u.role==='admin'?'badge-purple':u.role==='security'?'badge-yellow':'badge-blue'} capitalize`}>{u.role}</span></td>
                      <td><span className={`badge ${u.isActive?'badge-green':'badge-red'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                      <td className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg bg-dark-700 hover:bg-primary-700/30 text-slate-400 hover:text-primary-400 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(u._id, u.name)} className="p-1.5 rounded-lg bg-dark-700 hover:bg-red-700/30 text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan="7" className="text-center py-12 text-slate-500">No users found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">{editUser ? 'Edit User' : 'Add New User'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-dark-700 rounded-xl"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Full Name *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field" placeholder="Full name" /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Email *</label><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field" placeholder="Email" /></div>
                </div>
                {!editUser && (<div><label className="text-xs text-slate-400 mb-1 block">Password *</label><input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-field" placeholder="Min. 6 characters" /></div>)}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Role</label>
                    <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="input-field">
                      {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Phone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="input-field" placeholder="10-digit phone" /></div>
                </div>
                {form.role === 'resident' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400 mb-1 block">Wing</label><input value={form.wing} onChange={e=>setForm({...form,wing:e.target.value})} className="input-field" placeholder="A, B, C..." /></div>
                    <div><label className="text-xs text-slate-400 mb-1 block">Flat Number</label><input value={form.flatNumber} onChange={e=>setForm({...form,flatNumber:e.target.value})} className="input-field" placeholder="101, 202..." /></div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm">{saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary py-2.5 text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminResidents;
