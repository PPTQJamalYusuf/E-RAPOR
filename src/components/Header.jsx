import React from 'react';
import { Calendar, Download, Users, LogOut, PlusCircle, Cloud, History } from 'lucide-react';
import { formatNamaKelas } from '../utils/tahfidzCalc';

export default function Header({
  currentUser,
  activeModule = 'tahfidz',
  onChangeModule,
  onLogout,
  onOpenManageUsers,
  onOpenActivityLog,
  periods,
  currentPeriod,
  onChangePeriod,
  onOpenAddSemester,
  onExportSemester
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="app-header-pro">
      
      {/* TIER 1: BRANDING & USER CONTROLS */}
      <div className="header-pro-topbar">
        
        {/* Left: Logo & Dual-language Typography */}
        <div className="header-pro-branding">
          <div className="header-pro-logo-box">
            <img src="/logo.png" alt="Logo Pondok" className="header-pro-logo-img" />
          </div>
          <div className="header-pro-title-group">
            <div className="header-pro-title-ar">
              {activeModule === 'diniyah' ? 'كشف درجات العلوم الدينية' : 'كشف درجات تحفيظ القرآن الكريم'}
            </div>
            <h1 className="header-pro-title-latin">
              {activeModule === 'diniyah' ? 'E-Rapor Diniyah & Pengelolaan Pondok' : 'E-Rapor Tahfidz & Pengelolaan Pondok'}
            </h1>
            <p className="header-pro-subtitle">
              PPTQ JAMAL YUSUF AL-HADDAD • Sistem Cloud Terpusat
            </p>
          </div>
        </div>

        {/* Right: Quick Tools & Profile Card */}
        <div className="header-pro-user-cluster">
          
          {/* Cloud Status Pill */}
          <div className="header-pro-cloud-badge" title="Sistem terhubung ke Supabase Cloud">
            <span className="cloud-dot-pulse"></span>
            <span>Cloud Online</span>
          </div>

          {/* Tombol Kelola Guru & Riwayat Log (Admin Saja) */}
          {isAdmin && (
            <>
              <button
                type="button"
                className="header-pro-btn btn-highlight-green"
                onClick={onOpenManageUsers}
                title="Kelola Akun Guru & Penugasan Kelas"
              >
                <Users size={15} />
                <span>Kelola Guru</span>
              </button>
              <button
                type="button"
                className="header-pro-btn"
                onClick={onOpenActivityLog}
                title="Lihat Riwayat Aktivitas & Edit Nilai"
              >
                <History size={15} />
                <span>Riwayat</span>
              </button>
            </>
          )}

          {/* Tombol Backup Data JSON */}
          <button
            type="button"
            className="header-pro-btn"
            onClick={onExportSemester}
            title="Unduh file arsip cadangan semester ini"
          >
            <Download size={14} />
            <span>Backup</span>
          </button>

          {/* Integrated User Profile & Logout */}
          <div className="header-pro-profile-chip">
            <div className="header-pro-profile-avatar">
              {isAdmin ? '👑' : currentUser?.role === 'guru_diniyah' ? '📚' : '📖'}
            </div>
            <div className="header-pro-profile-text">
              <div className="header-pro-profile-name">
                {currentUser?.nama || 'Pengguna'}
              </div>
              <div className="header-pro-profile-role">
                {isAdmin 
                  ? 'Administrator' 
                  : `${currentUser?.role === 'guru_diniyah' ? 'Guru Diniyah' : 'Guru Tahfidz'} • ${currentUser?.kelas_binaan === 'Semua' ? 'Semua' : formatNamaKelas(currentUser?.kelas_binaan)}`}
              </div>
            </div>
            <button
              type="button"
              className="header-pro-logout-btn"
              onClick={onLogout}
              title="Keluar dari akun"
            >
              <LogOut size={14} />
            </button>
          </div>

        </div>
      </div>

      {/* TIER 2: PRIMARY NAVIGATION & SEMESTER CONTROL STRIP */}
      <div className="header-pro-navbar">
        
        {/* Left: Module Switcher (Segmented Pill) */}
        {isAdmin ? (
          <div className="module-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeModule === 'tahfidz'}
              className={`module-tab-btn ${activeModule === 'tahfidz' ? 'active' : ''}`}
              onClick={() => onChangeModule && onChangeModule('tahfidz')}
            >
              <span className="tab-icon">📖</span>
              <span className="tab-title">Tahfidz</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeModule === 'diniyah'}
              className={`module-tab-btn ${activeModule === 'diniyah' ? 'active' : ''}`}
              onClick={() => onChangeModule && onChangeModule('diniyah')}
            >
              <span className="tab-icon">📚</span>
              <span className="tab-title">Diniyah</span>
            </button>
          </div>
        ) : (
          <div className="guru-module-badge">
            <span className="guru-badge-icon">{activeModule === 'diniyah' ? '📚' : '📖'}</span>
            <span className="guru-badge-text">
              {activeModule === 'diniyah' ? 'Modul E-Rapor Diniyah' : 'Modul E-Rapor Tahfidz Al-Qur\'an'}
            </span>
          </div>
        )}

        {/* Right: Academic Semester Controls */}
        <div className="header-pro-period-control">
          <div className="period-pill-unified">
            <Calendar size={14} className="period-calendar-icon" />
            <span className="period-label">Semester:</span>
            {isAdmin ? (
              <select
                value={currentPeriod?.id || ''}
                onChange={(e) => {
                  const selected = periods.find(p => p.id === e.target.value);
                  if (selected) onChangePeriod(selected);
                }}
                className="period-select-pro"
                title="Pilih semester akademik"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.tahun_ajaran} — Semester {p.semester}
                  </option>
                ))}
              </select>
            ) : (
              <span className="period-val-text">
                {currentPeriod?.tahun_ajaran || '2026/2027'} — Semester {currentPeriod?.semester || 'Ganjil'}
              </span>
            )}
          </div>

          {isAdmin && (
            <button
              type="button"
              className="period-add-btn"
              onClick={onOpenAddSemester}
              title="Tambah / Buka Semester Baru"
            >
              <PlusCircle size={13} />
              <span>+ Baru</span>
            </button>
          )}
        </div>

      </div>

    </header>
  );
}
