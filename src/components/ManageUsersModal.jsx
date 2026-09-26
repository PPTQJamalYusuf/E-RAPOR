import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users, Trash2, Key, Check, AlertCircle } from 'lucide-react';
import { getAppUsers, createAppUser, updateAppUser, deleteAppUser } from '../lib/supabase';
import { KELAS_BILINGUAL } from '../utils/tahfidzCalc';

export default function ManageUsersModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(true); // Form terbuka agar langsung terlihat
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    role: 'guru',
    kelas_binaan: 'Semua'
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset Password State
  const [resettingId, setResettingId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAppUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Gagal load users:', err);
      setErrorMsg('Gagal memuat daftar pengguna dari Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.username.trim() || !formData.password.trim()) {
      setErrorMsg('Harap lengkapi semua isian: Nama, Username, dan Password!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await createAppUser(formData);
      setSuccessMsg(`Alhamdulillah! Akun "${formData.nama}" (${formData.username}) berhasil disimpan.`);
      setFormData({
        nama: '',
        username: '',
        password: '',
        role: 'guru',
        kelas_binaan: 'Semua'
      });
      await loadUsers();
    } catch (err) {
      console.error('Error create user:', err);
      setErrorMsg(err.message?.includes('duplicate') 
        ? `Username "${formData.username}" sudah dipakai, gunakan username lain.` 
        : `Gagal membuat akun: ${err.message || 'Periksa koneksi'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun ${nama}?`)) return;
    try {
      await deleteAppUser(id);
      setSuccessMsg(`Akun "${nama}" berhasil dihapus.`);
      await loadUsers();
    } catch (err) {
      setErrorMsg('Gagal menghapus akun: ' + (err.message || ''));
    }
  };

  const handleResetPassword = async (id, nama) => {
    if (!newPassword.trim()) {
      alert('Ketik password baru terlebih dahulu!');
      return;
    }
    try {
      await updateAppUser(id, { password: newPassword.trim() });
      setSuccessMsg(`Password untuk "${nama}" berhasil diubah!`);
      setResettingId(null);
      setNewPassword('');
    } catch (err) {
      setErrorMsg('Gagal mengubah password: ' + (err.message || ''));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857' }}>
              <Users size={24} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Kelola Akun Guru & Administrator
              </h2>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Tambah akun ustadzah baru dan atur penugasan kelas binaan di Supabase Cloud
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={22} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto' }}>
          
          {errorMsg && (
            <div className="login-error-banner" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#ecfdf5', color: '#047857', border: '1.5px solid #86efac', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Tambah Guru Baru */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '18px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} /> + Tambah Akun Ustadzah / Admin Baru
              </h3>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '4px' }}>
                    Nama Lengkap <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Misal: Ustadzah Maryam"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '4px' }}>
                    Username Login <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Misal: maryam"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '4px' }}>
                    Password <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password baru..."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '4px' }}>
                    Peran (Role)
                  </label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="guru">Guru / Ustadzah</option>
                    <option value="admin">Administrator Pondok</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '4px' }}>
                    Tugas Kelas Binaan (Ustadzah hanya akan menginput kelas ini)
                  </label>
                  <select
                    className="form-control"
                    value={formData.kelas_binaan}
                    onChange={(e) => setFormData({ ...formData, kelas_binaan: e.target.value })}
                  >
                    <option value="Semua">Semua Kelas (Bebas Akses Seluruh Kelas)</option>
                    {Object.keys(KELAS_BILINGUAL).map(k => (
                      <option key={k} value={k}>{KELAS_BILINGUAL[k]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ 
                    padding: '8px 18px', 
                    fontWeight: '700', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    background: '#047857',
                    color: '#ffffff',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={16} /> {submitting ? 'Menyimpan ke Cloud...' : 'Simpan Akun Sekarang'}
                </button>
              </div>
            </form>
          </div>

          {/* Daftar Pengguna Terdaftar */}
          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>
              Daftar Akun Terdaftar ({users.length} Akun)
            </h4>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                Sedang memuat data pengguna dari Supabase...
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table className="santri-table" style={{ fontSize: '0.88rem', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#f1f5f9', color: '#334155' }}>Nama Ustadzah / Admin</th>
                      <th style={{ background: '#f1f5f9', color: '#334155' }}>Username</th>
                      <th style={{ background: '#f1f5f9', color: '#334155' }}>Peran</th>
                      <th style={{ background: '#f1f5f9', color: '#334155' }}>Kelas Binaan</th>
                      <th style={{ background: '#f1f5f9', color: '#334155', textAlign: 'center', width: '190px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: '700', color: '#0f172a' }}>{u.nama}</td>
                        <td>
                          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0369a1', fontWeight: '600' }}>
                            {u.username}
                          </code>
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: u.role === 'admin' ? '#fef3c7' : '#ecfdf5',
                            color: u.role === 'admin' ? '#92400e' : '#047857',
                            border: u.role === 'admin' ? '1px solid #fde047' : '1px solid #a7f3d0'
                          }}>
                            {u.role === 'admin' ? '👑 Admin' : '👩‍🏫 Guru'}
                          </span>
                        </td>
                        <td>
                          {u.kelas_binaan === 'Semua' ? (
                            <span style={{ color: '#64748b' }}>Semua Kelas</span>
                          ) : (
                            <span style={{ fontWeight: '700', color: '#047857' }}>
                              {KELAS_BILINGUAL[u.kelas_binaan] || u.kelas_binaan}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                            {resettingId === u.id ? (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  placeholder="Pass baru"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  style={{ width: '90px', padding: '4px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', color: '#000' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{ padding: '4px 8px', background: '#047857', color: '#fff' }}
                                  onClick={() => handleResetPassword(u.id, u.nama)}
                                  title="Simpan"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{ padding: '4px 6px', background: '#e2e8f0', color: '#334155' }}
                                  onClick={() => setResettingId(null)}
                                  title="Batal"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.78rem', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155' }}
                                onClick={() => { setResettingId(u.id); setNewPassword(''); }}
                                title="Reset Password"
                              >
                                <Key size={13} /> Reset Pass
                              </button>
                            )}

                            {u.username !== 'admin' && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ padding: '4px 8px', color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}
                                onClick={() => handleDeleteUser(u.id, u.nama)}
                                title="Hapus Akun Ini"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontWeight: '600', padding: '6px 16px' }}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
