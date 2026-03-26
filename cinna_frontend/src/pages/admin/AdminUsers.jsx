// ═══════════════════════════════════════════════════
// src/pages/admin/AdminUsers.jsx  — MOBILE RESPONSIVE
// ═══════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
 
export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [error,   setError]   = useState(null);
  const [toast,   setToast]   = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
 
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
 
  const fetchUsers = async (q = '') => {
    setLoading(true);
    try { const data = await adminAPI.getUsers({ limit:100, search:q }); setUsers(Array.isArray(data) ? data : data.results || []); }
    catch { setError('Failed to load users.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);
 
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
 
  const toggleActive = async (user) => {
    try { await adminAPI.updateUser(user.id, { is_active: !user.is_active }); setUsers(prev => prev.map(u => u.id === user.id ? {...u, is_active:!u.is_active} : u)); showToast(`${user.username} ${!user.is_active ? 'activated' : 'deactivated'}`); }
    catch { showToast('Failed to update user.', 'error'); }
  };
  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try { await adminAPI.deleteUser(user.id); setUsers(prev => prev.filter(u => u.id !== user.id)); showToast(`${user.username} deleted.`); }
    catch { showToast('Failed to delete user.', 'error'); }
  };
 
  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
 
  return (
    <AdminLayout>
      {toast && <div style={{ ...t.toast, backgroundColor: toast.type==='error' ? '#dc2626' : '#16a34a' }}>{toast.msg}</div>}
      <div style={t.header}>
        <div><h1 style={t.title}>User Management</h1><p style={t.subtitle}>Manage all registered users</p></div>
      </div>
      <div style={{ ...t.toolbar, flexWrap:'wrap' }}>
        <input style={t.search} placeholder="🔍  Search by name, username or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <span style={t.count}>{filtered.length} users</span>
      </div>
      <div style={{ ...t.card, overflowX: isMobile ? 'hidden' : 'auto' }}>
        {loading ? <p style={t.empty}>Loading…</p> : error ? <p style={{ ...t.empty, color:'#dc2626' }}>{error}</p> : isMobile ? (
          /* Mobile card list */
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {filtered.length === 0 ? <p style={t.empty}>No users found</p> : filtered.map(u => (
              <div key={u.id} style={mobileCard}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                  <div>
                    <div style={{ fontWeight:700, color:'#1a2e44', fontSize:'0.92rem' }}>{u.first_name} {u.last_name}</div>
                    <div style={{ fontSize:'0.78rem', color:'#64748b' }}>@{u.username} · {u.email}</div>
                  </div>
                  <span style={u.is_active ? t.activePill : t.inactivePill}>{u.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap', marginBottom:'0.5rem' }}>
                  <RoleBadge role={u.role} />
                  <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Joined {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}</span>
                </div>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  <button style={{ ...t.actionBtn, backgroundColor: u.is_active ? '#fef9c3' : '#dcfce7', color: u.is_active ? '#ca8a04' : '#16a34a' }} onClick={() => toggleActive(u)}>
                    {u.is_active ? '🔒 Deactivate' : '✅ Activate'}
                  </button>
                  {u.role !== 'admin' && <button style={{ ...t.actionBtn, backgroundColor:'#fee2e2', color:'#dc2626' }} onClick={() => deleteUser(u)}>🗑 Delete</button>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table style={t.table}>
            <thead><tr>{['Name','Username','Email','Role','Status','Joined','Actions'].map(h => <th key={h} style={t.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={7} style={t.empty}>No users found</td></tr>
                : filtered.map(u => (
                <tr key={u.id} style={t.tr}>
                  <td style={t.td}><strong>{u.first_name} {u.last_name}</strong></td>
                  <td style={t.td}>{u.username}</td>
                  <td style={t.td}>{u.email}</td>
                  <td style={t.td}><RoleBadge role={u.role} /></td>
                  <td style={t.td}><span style={u.is_active ? t.activePill : t.inactivePill}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={t.td}>{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}</td>
                  <td style={t.td}>
                    <div style={t.actions}>
                      <button style={{ ...t.actionBtn, backgroundColor: u.is_active ? '#fef9c3' : '#dcfce7', color: u.is_active ? '#ca8a04' : '#16a34a' }} onClick={() => toggleActive(u)}>{u.is_active ? '🔒 Deactivate' : '✅ Activate'}</button>
                      {u.role !== 'admin' && <button style={{ ...t.actionBtn, backgroundColor:'#fee2e2', color:'#dc2626' }} onClick={() => deleteUser(u)}>🗑 Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
 
function RoleBadge({ role }) {
  const map = { manufacturer:{ bg:'#fef3c7', color:'#d97706' }, buyer:{ bg:'#dbeafe', color:'#2563eb' }, admin:{ bg:'#ede9fe', color:'#7c3aed' } };
  const c = map[role?.toLowerCase()] || { bg:'#f1f5f9', color:'#64748b' };
  return <span style={{ display:'inline-block', borderRadius:4, fontSize:'0.75rem', fontWeight:600, padding:'2px 8px', backgroundColor:c.bg, color:c.color }}>{role||'—'}</span>;
}
 
const mobileCard = { padding:'0.9rem', backgroundColor:'#fff', borderRadius:8, border:'1px solid #e2e8f0' };
const t = {
  toast:       { position:'fixed', top:20, right:20, zIndex:9999, color:'#fff', padding:'10px 20px', borderRadius:8, fontWeight:600, fontSize:'0.9rem', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' },
  header:      { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' },
  title:       { margin:0, fontSize:'1.5rem', fontWeight:800, color:'#1a2e44' },
  subtitle:    { margin:'4px 0 0', fontSize:'0.9rem', color:'#64748b' },
  toolbar:     { display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem' },
  search:      { flex:1, padding:'0.65rem 1rem', border:'1px solid #e2e8f0', borderRadius:8, fontSize:'0.9rem', outline:'none', minWidth:0 },
  count:       { color:'#64748b', fontSize:'0.85rem', whiteSpace:'nowrap' },
  card:        { backgroundColor:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 1px 6px rgba(0,0,0,0.07)' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' },
  th:          { padding:'0.6rem 0.75rem', textAlign:'left', color:'#94a3b8', fontWeight:600, fontSize:'0.75rem', textTransform:'uppercase', borderBottom:'2px solid #f1f5f9', whiteSpace:'nowrap' },
  td:          { padding:'0.75rem', color:'#374151', borderBottom:'1px solid #f8fafc', verticalAlign:'middle' },
  tr:          {},
  empty:       { padding:'2rem', textAlign:'center', color:'#94a3b8' },
  activePill:  { display:'inline-block', backgroundColor:'#dcfce7', color:'#16a34a', borderRadius:4, fontSize:'0.72rem', fontWeight:600, padding:'2px 8px', whiteSpace:'nowrap' },
  inactivePill:{ display:'inline-block', backgroundColor:'#fee2e2', color:'#dc2626', borderRadius:4, fontSize:'0.72rem', fontWeight:600, padding:'2px 8px', whiteSpace:'nowrap' },
  actions:     { display:'flex', gap:'0.4rem', flexWrap:'wrap' },
  actionBtn:   { padding:'4px 10px', border:'none', borderRadius:5, fontSize:'0.78rem', fontWeight:600, cursor:'pointer' },
};