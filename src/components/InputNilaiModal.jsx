import React, { useState } from 'react';
import { X, Save, MessageSquare, Sparkles } from 'lucide-react';
import { getPredikat, hitungRapor, PREDIKAT_COLORS } from '../utils/tahfidzCalc';

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

  const renderJuzSection = (title, startJuz, endJuz) => {
    const list = [];
    for (let j = startJuz; j <= endJuz; j++) {
      list.push(j);
    }

    return (
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="juz-section-title">
          <span>📖</span> {title}
        </div>
        <div className="juz-grid">
          {list.map(j => {
            const val = nilaiJuz[j] !== undefined ? nilaiJuz[j] : '';
            const predikat = getPredikat(val);
            const pColor = PREDIKAT_COLORS[predikat] || PREDIKAT_COLORS['-'];

            return (
              <div key={j} className="juz-card-input">
                <div className="juz-number">Juz {j} (الجزء {j})</div>
                <input
                  type="number"
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Input Nilai Tahfidz & Catatan: {santri.nama}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              NIS: {santri.nis || santri.id} • Kelas: <strong>{santri.kelas}</strong>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Ringkasan Nilai Realtime */}
          <div style={{
            background: colorInfo.bg,
            border: `1.5px solid ${colorInfo.border}`,
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: colorInfo.text }}>
                STATUS PENILAIAN TAHFIDZ
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: colorInfo.text }}>
                {calc.count} Juz Diuji • Total Nilai: {calc.total}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: colorInfo.text }}>Rata-rata (الدرجة)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: colorInfo.text }}>
                  {calc.count > 0 ? calc.rataRata : '-'}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: colorInfo.text }}>Predikat (التقدير)</div>
                <div className="arabic" style={{ fontSize: '1.6rem', fontWeight: 700, color: colorInfo.text }}>
                  {calc.predikatAkhir}
                </div>
              </div>
            </div>
          </div>

          {/* INPUT JUMLAH HAFALAN (CUSTOM / FLEKSIBEL) */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid var(--slate-300)',
            borderRadius: '10px',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1', minWidth: '220px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--slate-800)',
                marginBottom: '0.2rem'
              }}>
                📖 Jumlah Hafalan Santriwati (عدد الحفظ):
              </label>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                Isi jika ingin custom (contoh: <em>5 Juz</em>, <em>10 Juz</em>, atau <em>3 Juz Mutqin</em>). Kosongkan jika ingin otomatis sesuai jumlah juz yang dinilai ({calc.count} Juz).
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={jumlahHafalan}
                onChange={(e) => setJumlahHafalan(e.target.value)}
                placeholder={calc.count > 0 ? `${calc.count} Juz (Otomatis)` : 'Contoh: 5 Juz'}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  border: '1.5px solid #047857',
                  borderRadius: '6px',
                  width: '180px',
                  color: '#1b4332',
                  outline: 'none',
                  background: '#f0fdf4'
                }}
              />
              {jumlahHafalan && (
                <button
                  type="button"
                  onClick={() => setJumlahHafalan('')}
                  className="btn btn-secondary btn-sm"
                  title="Kembalikan ke hitungan otomatis"
                  style={{ fontSize: '0.75rem', padding: '0.45rem 0.6rem' }}
                >
                  Reset Otomatis
                </button>
              )}
            </div>
          </div>

          {/* 3 Blok Juz sesuai template Excel pondok */}
          {renderJuzSection('Kelompok Juz 1 s/d 10', 1, 10)}
          {renderJuzSection('Kelompok Juz 11 s/d 20', 11, 20)}
          {renderJuzSection('Kelompok Juz 21 s/d 30', 21, 30)}

          {/* FORM INPUT CATATAN PEMBINA DI DALAM MODAL NILAI */}
          <div style={{
            marginTop: '1.5rem',
            background: '#f8fafc',
            border: '1.5px solid var(--slate-300)',
            borderRadius: '10px',
            padding: '1.1rem'
          }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={16} color="#2d6a4f" />
              <span>Catatan Pembina / Ustadzah untuk Rapor:</span>
            </div>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis catatan evaluasi hafalan santri di sini..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                border: '1px solid var(--slate-300)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                lineHeight: 1.4,
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: 600 }}>
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
                  Opsi {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
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
