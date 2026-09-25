import React from 'react';
import { BookOpen, Download, RotateCcw, ShieldCheck } from 'lucide-react';

export default function Header({ onExport, onReset, santriCount }) {
  return (
    <header className="app-header">
      <div className="header-branding">
        <div className="logo-badge">
          📖
        </div>
        <div>
          <div className="header-title-arabic">كشف درجات تحفيظ القرآن</div>
          <h1 className="header-title-latin">E-Rapor Tahfidz & Pengelolaan Pondok</h1>
          <p className="header-subtitle">
            Sistem Penilaian Santriwati Tahfidz Al-Qur'an • 100% Gratis & Mandiri
          </p>
        </div>
      </div>

      <div className="header-actions">
        <span className="badge-free">
          <ShieldCheck size={14} /> Mode Lokal Bebas Biaya (Rp 0)
        </span>
        <button className="btn btn-secondary btn-sm" onClick={onExport} title="Unduh cadangan data nilai (JSON)">
          <Download size={14} /> Backup Data
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onReset} title="Reset kembali ke data master Excel">
          <RotateCcw size={14} /> Reset Excel
        </button>
      </div>
    </header>
  );
}
