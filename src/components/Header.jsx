import React from 'react';
import { Calendar, Download, Users, LogOut, PlusCircle, Cloud } from 'lucide-react';
import { KELAS_BILINGUAL } from '../utils/tahfidzCalc';

export default function Header({
  currentUser,
  onLogout,
  onOpenManageUsers,
  periods,
  currentPeriod,
  onChangePeriod,
  onOpenAddSemester,
  onExportSemester
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="app-header">
      <div className="header-branding">
        <div className="logo-badge">
          <img src="/logo.png" alt="Logo Pondok" className="header-logo-img" />
        </div>
        <div>
          <div className="header-title-arabic">كشف درجات تحفيظ القرآن</div>
          <h1 className="header-title-latin">E-Rapor Tahfidz & Pengelolaan Pondok</h1>
          <p className="header-subtitle">
            Kulliyyatul Mu'allimat Al-Islamiyyah • Sistem Cloud Terpusat
          </p>
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        {/* Semester Selector */}
        <div className="period-selector-pill" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: '#ffffff', 
          border: '2px solid rgba(255, 255, 255, 0.6)', 
          borderRadius: '10px', 
          padding: '4px 10px', 
          gap: '6px',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.12)'
        }}>
          <Calendar size={16} style={{ color: '#047857' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#047857' }}>Semester:</span>
          <select
            value={currentPeriod?.id || ''}
            onChange={(e) => {
              const selected = periods.find(p => p.id === e.target.value);
              if (selected) onChangePeriod(selected);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '0.88rem',
              fontWeight: '800',
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.tahun_ajaran} - Semester {p.semester}
              </option>
            ))}
          </select>

          {isAdmin && (
            <button
              onClick={onOpenAddSemester}
              title="Tambah Semester Baru"
              style={{
                border: 'none',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <PlusCircle size={13} /> + Baru
            </button>
          )}
        </div>

        {/* Cloud Status */}
        <span className="badge-free" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.35)', fontWeight: '600' }}>
          <Cloud size={14} style={{ color: '#6ee7b7' }} /> Cloud Online
        </span>

        {/* Tombol Backup Data JSON */}
        <button
          className="btn btn-sm"
          onClick={onExportSemester}
          title="Unduh file backup riwayat semester ini"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.18)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            fontWeight: '600'
          }}
        >
          <Download size={14} /> Backup
        </button>

        {/* Tombol Kelola Guru (Admin Saja) */}
        {isAdmin && (
          <button
            className="btn btn-sm"
            onClick={onOpenManageUsers}
            title="Kelola Akun Guru & Penugasan Kelas"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              background: '#ffffff',
              color: '#047857',
              border: '1.5px solid #a7f3d0',
              fontWeight: '800',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
              cursor: 'pointer'
            }}
          >
            <Users size={16} /> Kelola Guru
          </button>
        )}

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1.5px solid rgba(255, 255, 255, 0.35)', paddingLeft: '12px' }}>
          <div style={{ textAlign: 'right', lineHeight: '1.25' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#ffffff' }}>
              {isAdmin ? '👑 ' : '👩‍🏫 '}{currentUser?.nama || 'Pengguna'}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fef08a' }}>
              {isAdmin ? 'Administrator' : (currentUser?.kelas_binaan === 'Semua' ? 'Semua Kelas' : KELAS_BILINGUAL[currentUser?.kelas_binaan] || currentUser?.kelas_binaan)}
            </div>
          </div>
          <button
            className="btn btn-sm"
            onClick={onLogout}
            title="Keluar dari Akun"
            style={{ 
              padding: '6px 8px', 
              background: '#fee2e2', 
              color: '#dc2626', 
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
