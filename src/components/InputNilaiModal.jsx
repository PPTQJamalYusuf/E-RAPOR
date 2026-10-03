import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, MessageSquare, AlertTriangle } from 'lucide-react';
import { 
  getPredikat, 
  hitungRapor, 
  hitungRaporTahsin, 
  KRITERIA_TAHSIN, 
  PREDIKAT_COLORS 
} from '../utils/tahfidzCalc';

export default function InputNilaiModal({ santri, onClose, onSave }) {
  const [nilaiJuz, setNilaiJuz] = useState({ ...(santri.nilaiJuz || {}) });
  const [nilaiTahsin, setNilaiTahsin] = useState({ ...(santri.nilaiTahsin || {}) });
  const [catatan, setCatatan] = useState(santri.catatan || '');
  const [jumlahHafalan, setJumlahHafalan] = useState(santri.jumlahHafalan || '');
  const [activeProgramMode, setActiveProgramMode] = useState(santri.is_tahsin ? 'tahsin' : 'tahfidz');
  const [activeTab, setActiveTab] = useState('all');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Deteksi apakah ada nilai atau catatan yang telah diubah dari data awal (Dirty State)
  const isDirty = useMemo(() => {
    // 1. Cek perubahan catatan
    if ((catatan || '') !== (santri.catatan || '')) return true;

    // 2. Cek perubahan jumlah hafalan
    if ((jumlahHafalan || '').trim() !== (santri.jumlahHafalan || '').trim()) return true;

    // 3. Cek perubahan nilai juz
    const initialJuz = santri.nilaiJuz || {};
    const initialKeys = Object.keys(initialJuz);
    const currentKeys = Object.keys(nilaiJuz);

    if (initialKeys.length !== currentKeys.length) return true;

    for (const k of currentKeys) {
      if (!(k in initialJuz)) return true;
      if (Number(nilaiJuz[k]) !== Number(initialJuz[k])) return true;
    }

    // 4. Cek perubahan nilai tahsin jika santri tahsin
    if (santri.is_tahsin) {
      const initialTahsin = santri.nilaiTahsin || {};
      for (const k of KRITERIA_TAHSIN) {
        if ((nilaiTahsin[k.id] ?? '') !== (initialTahsin[k.id] ?? '')) return true;
      }
    }

    return false;
  }, [nilaiJuz, nilaiTahsin, catatan, jumlahHafalan, santri]);

  // Handler permintaan tutup modal (dengan konfirmasi jika ada perubahan belum disimpan)
  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Tangani klik pada area luar modal (backdrop / overlay)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleRequestClose();
    }
  };

  // Tangani tombol ESC keyboard (Capture phase agar dicegat sebelum handler modal global di App.jsx)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showConfirmClose) {
          setShowConfirmClose(false);
        } else {
          handleRequestClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleRequestClose, showConfirmClose]);

  // Peringatan native browser jika tab ditutup / direfresh saat data belum disimpan
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleScoreChange = (juz, val) => {
    if (val === '') {
      const updated = { ...nilaiJuz };
      delete updated[juz];
      setNilaiJuz(updated);
      return;
    }

    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setNilaiJuz(prev => ({
        ...prev,
        [juz]: num
      }));
    }
  };

  const handleTahsinScoreChange = (kriteriaId, val) => {
    if (val === '') {
      const updated = { ...nilaiTahsin };
      delete updated[kriteriaId];
      setNilaiTahsin(updated);
      return;
    }

    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setNilaiTahsin(prev => ({
        ...prev,
        [kriteriaId]: num
      }));
    }
  };

  const calc = hitungRapor(nilaiJuz);
  const colorInfo = PREDIKAT_COLORS[calc.predikatAkhir] || PREDIKAT_COLORS['-'];

  const calcTahsin = hitungRaporTahsin(nilaiTahsin);
  const colorTahsin = PREDIKAT_COLORS[calcTahsin.predikatAkhir] || PREDIKAT_COLORS['-'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(santri.id, nilaiJuz, catatan, jumlahHafalan.trim(), nilaiTahsin);
    onClose();
  };

  const renderJuzSection = (titleIndo, startJuz, endJuz) => {
    const list = [];
    for (let j = startJuz; j <= endJuz; j++) {
      list.push(j);
    }

    return (
      <div className="juz-section-block">
        <div className="juz-section-title">
          <span className="juz-section-icon">📖</span>
          <span className="juz-section-text">{titleIndo}</span>
        </div>
        <div className="juz-grid">
          {list.map(j => {
            const val = nilaiJuz[j] !== undefined ? nilaiJuz[j] : '';
            const predikat = getPredikat(val);
            const pColor = PREDIKAT_COLORS[predikat] || PREDIKAT_COLORS['-'];

            return (
              <div key={j} className="juz-card-input">
                <div className="juz-number">Juz {j}</div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  max="100"
                  placeholder="-"
                  className="juz-input-field"
                  value={val}
                  onChange={(e) => handleScoreChange(j, e.target.value)}
                />
                <div
                  className="juz-predikat-badge"
                  style={{ color: pColor.text }}
                >
                  {predikat || '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content input-nilai-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <h2 className="modal-title-main">
              Input Nilai Tahfidz & Catatan: {santri.nama}
            </h2>
            <div className="modal-subtitle-nis">
              NIS: {santri.nis || santri.id} • Kelas: <strong>{santri.kelas}</strong>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm btn-modal-close" onClick={handleRequestClose} title="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body input-nilai-modal-body">
          {/* Switcher Tab Khusus Santri Program Tahsin */}
          {santri.is_tahsin && (
            <div className="program-mode-switcher">
              <button
                type="button"
                className={`program-mode-btn ${activeProgramMode === 'tahfidz' ? 'active' : ''}`}
                onClick={() => setActiveProgramMode('tahfidz')}
              >
                📖 Nilai Hafalan Tahfidz (30 Juz)
              </button>
              <button
                type="button"
                className={`program-mode-btn ${activeProgramMode === 'tahsin' ? 'active' : ''}`}
                onClick={() => setActiveProgramMode('tahsin')}
              >
                🗣️ Nilai Kualitas Bacaan Tahsin (7 Aspek)
              </button>
            </div>
          )}

          {(!santri.is_tahsin || activeProgramMode === 'tahfidz') ? (
            <>
              {/* Ringkasan Nilai Realtime Responsif */}
              <div
                className="nilai-summary-banner"
                style={{
                  background: colorInfo.bg,
                  border: `1.5px solid ${colorInfo.border}`
                }}
              >
                <div className="nilai-summary-primary">
                  <div className="summary-status-tag" style={{ color: colorInfo.text }}>
                    STATUS PENILAIAN TAHFIDZ
                  </div>
                  <div className="summary-main-count" style={{ color: colorInfo.text }}>
                    {calc.count} Juz Diuji • Total Nilai: {calc.total}
                  </div>
                </div>

                <div className="nilai-summary-metrics">
                  <div className="summary-metric-card">
                    <div className="metric-lbl" style={{ color: colorInfo.text }}>Rata-rata (الدرجة)</div>
                    <div className="metric-val" style={{ color: colorInfo.text }}>
                      {calc.count > 0 ? calc.rataRata : '-'}
                    </div>
                  </div>

                  <div className="summary-metric-card">
                    <div className="metric-lbl" style={{ color: colorInfo.text }}>Predikat (التقدير)</div>
                    <div className="metric-val arabic" style={{ color: colorInfo.text }}>
                      {calc.predikatAkhir}
                    </div>
                  </div>
                </div>
              </div>

              {/* INPUT JUMLAH HAFALAN (CUSTOM / FLEKSIBEL) */}
              <div className="hafalan-custom-box">
                <div className="hafalan-custom-info">
                  <label className="hafalan-custom-label">
                    📖 Jumlah Hafalan Santriwati (عدد الحفظ):
                  </label>
                </div>

                <div className="hafalan-input-group">
                  <input
                    type="text"
                    value={jumlahHafalan}
                    onChange={(e) => setJumlahHafalan(e.target.value)}
                    placeholder={calc.count > 0 ? `${calc.count} Juz (Otomatis)` : 'Contoh: 5 Juz'}
                    className="hafalan-input-field"
                  />
                  {jumlahHafalan && (
                    <button
                      type="button"
                      onClick={() => setJumlahHafalan('')}
                      className="btn btn-secondary btn-sm btn-reset-hafalan"
                      title="Kembalikan ke hitungan otomatis"
                    >
                      Reset Otomatis
                    </button>
                  )}
                </div>
              </div>

              {/* TAB PINTAS NAVIGASI JUZ (MEMUDAHKAN GURU DI HP & TABLET) */}
              <div className="juz-nav-tabs">
                <button
                  type="button"
                  className={`juz-nav-tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  Semua Juz (1–30)
                </button>
                <button
                  type="button"
                  className={`juz-nav-tab ${activeTab === '1-10' ? 'active' : ''}`}
                  onClick={() => setActiveTab('1-10')}
                >
                  Juz 1–10
                </button>
                <button
                  type="button"
                  className={`juz-nav-tab ${activeTab === '11-20' ? 'active' : ''}`}
                  onClick={() => setActiveTab('11-20')}
                >
                  Juz 11–20
                </button>
                <button
                  type="button"
                  className={`juz-nav-tab ${activeTab === '21-30' ? 'active' : ''}`}
                  onClick={() => setActiveTab('21-30')}
                >
                  Juz 21–30
                </button>
              </div>

              {/* 3 Blok Juz format angka Latin */}
              {(activeTab === 'all' || activeTab === '1-10') && renderJuzSection('Kelompok Juz 1 s/d 10', 1, 10)}
              {(activeTab === 'all' || activeTab === '11-20') && renderJuzSection('Kelompok Juz 11 s/d 20', 11, 20)}
              {(activeTab === 'all' || activeTab === '21-30') && renderJuzSection('Kelompok Juz 21 s/d 30', 21, 30)}
            </>
          ) : (
            <>
              {/* Banner Ringkasan Tahsin */}
              <div
                className="nilai-summary-banner tahsin-banner"
                style={{
                  background: colorTahsin.bg,
                  border: `1.5px solid ${colorTahsin.border}`
                }}
              >
                <div className="nilai-summary-primary">
                  <div className="summary-status-tag" style={{ color: colorTahsin.text }}>
                    STATUS PENILAIAN TAHSIN AL-QUR'AN
                  </div>
                  <div className="summary-main-count" style={{ color: colorTahsin.text }}>
                    {calcTahsin.count} Aspek Dinilai • Total Nilai: {calcTahsin.total}
                  </div>
                </div>

                <div className="nilai-summary-metrics">
                  <div className="summary-metric-card">
                    <div className="metric-lbl" style={{ color: colorTahsin.text }}>Rata-rata (الدرجة)</div>
                    <div className="metric-val" style={{ color: colorTahsin.text }}>
                      {calcTahsin.count > 0 ? calcTahsin.rataRata : '-'}
                    </div>
                  </div>

                  <div className="summary-metric-card">
                    <div className="metric-lbl" style={{ color: colorTahsin.text }}>Predikat (التقدير)</div>
                    <div className="metric-val arabic" style={{ color: colorTahsin.text }}>
                      {calcTahsin.predikatAkhir}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 7 Kriteria Nilai Tahsin */}
              <div className="tahsin-criteria-grid">
                {KRITERIA_TAHSIN.map((k, idx) => {
                  const val = nilaiTahsin[k.id] !== undefined ? nilaiTahsin[k.id] : '';
                  const pred = val !== '' ? getPredikat(val) : '';
                  const pColor = PREDIKAT_COLORS[pred] || PREDIKAT_COLORS['-'];
                  return (
                    <div key={k.id} className="tahsin-card-item">
                      <div className="tahsin-card-title-row">
                        <span className="tahsin-idx">{idx + 1}.</span>
                        <div className="tahsin-names">
                          <span className="tahsin-label-id">{k.labelId}</span>
                          <span className="tahsin-label-ar arabic">{k.labelAr}</span>
                        </div>
                      </div>
                      <div className="tahsin-input-control">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          max="100"
                          placeholder="0 - 100"
                          className="tahsin-input-box"
                          value={val}
                          onChange={(e) => handleTahsinScoreChange(k.id, e.target.value)}
                        />
                        <div
                          className="tahsin-pred-badge"
                          style={{
                            color: pColor.text,
                            background: pColor.bg,
                            borderColor: pColor.border
                          }}
                        >
                          {pred ? pred : '—'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* FORM INPUT CATATAN USTADZAH */}
          <div className="catatan-pembina-box">
            <div className="catatan-pembina-title">
              <MessageSquare size={16} color="#2d6a4f" />
              <span>Catatan Ustadzah:</span>
            </div>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis catatan evaluasi hafalan santri di sini..."
              className="catatan-pembina-textarea"
            />
          </div>
        </div>

        <div className="modal-footer input-nilai-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleRequestClose}>
            Batal
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            <Save size={16} /> Simpan Nilai & Catatan
          </button>
        </div>
      </div>

      {/* Dialog Konfirmasi Keluar saat ada Perubahan Belum Disimpan */}
      {showConfirmClose && (
        <div 
          className="confirm-dialog-overlay"
          onClick={() => setShowConfirmClose(false)}
        >
          <div className="confirm-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <div className="confirm-dialog-icon-wrapper">
                <AlertTriangle size={24} />
              </div>
              <div className="confirm-dialog-text-group">
                <h3 className="confirm-dialog-title">Perubahan Belum Disimpan</h3>
                <p className="confirm-dialog-text">
                  Ada nilai atau catatan santri <strong>{santri.nama}</strong> yang belum disimpan. Yakin ingin keluar dan membuang perubahan?
                </p>
              </div>
            </div>
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmClose(false)}
                autoFocus
              >
                Lanjut Mengedit
              </button>
              <button
                type="button"
                className="btn btn-danger-soft"
                onClick={onClose}
              >
                Buang & Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
