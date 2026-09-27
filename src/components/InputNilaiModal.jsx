import React, { useState } from 'react';
import { X, Save, MessageSquare, Sparkles } from 'lucide-react';
import { getPredikat, hitungRapor, PREDIKAT_COLORS } from '../utils/tahfidzCalc';

const toArabicNum = (n) => {
  if (n === null || n === undefined || n === '') return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return n.toString().split('').map(d => arabicDigits[d] || d).join('');
};

export default function InputNilaiModal({ santri, onClose, onSave }) {
  const [nilaiJuz, setNilaiJuz] = useState({ ...(santri.nilaiJuz || {}) });
  const [catatan, setCatatan] = useState(santri.catatan || '');
  const [jumlahHafalan, setJumlahHafalan] = useState(santri.jumlahHafalan || '');

  const presetCatatan = [
    "Hafalan sangat lancar, tajwid dan makhraj huruf sangat baik. Pertahankan prestasinya.",
    "Alhamdulillah lancar, tingkatkan intensitas muroja'ah harian agar hafalan semakin mutqin.",
    "Perlu perhatian khusus pada hukum tajwid (mad dan ghunnah) serta istiqomah menambah ziyadah.",
    "Alhamdulillah telah menyelesaikan evaluasi hafalan dengan tertib dan lancar. Pertahankan dan tingkatkan mutaba'ah ziyadah serta muroja'ah harian."
  ];

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

  const calc = hitungRapor(nilaiJuz);
  const colorInfo = PREDIKAT_COLORS[calc.predikatAkhir] || PREDIKAT_COLORS['-'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(santri.id, nilaiJuz, catatan, jumlahHafalan.trim());
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
          <span className="juz-section-text">
            Kelompok Juz {toArabicNum(startJuz)} s/d {toArabicNum(endJuz)}
          </span>
        </div>
        <div className="juz-grid">
          {list.map(j => {
            const val = nilaiJuz[j] !== undefined ? nilaiJuz[j] : '';
            const predikat = getPredikat(val);
            const pColor = PREDIKAT_COLORS[predikat] || PREDIKAT_COLORS['-'];

            return (
              <div key={j} className="juz-card-input">
                <div className="juz-number">Juz {toArabicNum(j)}</div>
                <input
                  type="number"
                  inputMode="numeric"
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
    <div className="modal-overlay" onClick={onClose}>
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
          <button className="btn btn-secondary btn-sm btn-modal-close" onClick={onClose} title="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body input-nilai-modal-body">
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
                {toArabicNum(calc.count)} Juz Diuji ({calc.count}) • Total: {calc.total}
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
              <div className="hafalan-custom-desc">
                Isi jika ingin custom (contoh: <em>{toArabicNum(5)} Juz</em>, <em>{toArabicNum(10)} Juz</em>, atau <em>{toArabicNum(3)} Juz Mutqin</em>). Kosongkan jika ingin otomatis sesuai jumlah juz yang dinilai ({toArabicNum(calc.count)} Juz).
              </div>
            </div>

            <div className="hafalan-input-group">
              <input
                type="text"
                value={jumlahHafalan}
                onChange={(e) => setJumlahHafalan(e.target.value)}
                placeholder={calc.count > 0 ? `${toArabicNum(calc.count)} Juz (${calc.count} Otomatis)` : `Contoh: ${toArabicNum(5)} Juz`}
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

          {/* 3 Blok Juz format angka Arab */}
          {renderJuzSection('Kelompok Juz 1 s/d 10', 1, 10)}
          {renderJuzSection('Kelompok Juz 11 s/d 20', 11, 20)}
          {renderJuzSection('Kelompok Juz 21 s/d 30', 21, 30)}

          {/* FORM INPUT CATATAN PEMBINA DI DALAM MODAL NILAI */}
          <div className="catatan-pembina-box">
            <div className="catatan-pembina-title">
              <MessageSquare size={16} color="#2d6a4f" />
              <span>Catatan Pembina / Ustadzah untuk Rapor:</span>
            </div>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis catatan evaluasi hafalan santri di sini..."
              className="catatan-pembina-textarea"
            />
            <div className="catatan-preset-wrapper">
              <span className="catatan-preset-label">
                <Sparkles size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Pilihan Cepat:
              </span>
              {presetCatatan.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn-preset-chip"
                  onClick={() => setCatatan(p)}
                  title={p}
                >
                  Opsi {toArabicNum(idx + 1)} ({idx + 1})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer input-nilai-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            <Save size={16} /> Simpan Nilai & Catatan
          </button>
        </div>
      </div>
    </div>
  );
}
