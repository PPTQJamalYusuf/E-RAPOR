import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare, BookOpen, AlertCircle } from 'lucide-react';
import { MATA_PELAJARAN_DINIYAH, getPredikatDiniyah, hitungRaporDiniyah, PREDIKAT_DINIYAH_COLORS } from '../utils/diniyahCalc';
import { formatNamaKelas } from '../utils/tahfidzCalc';

export default function InputDiniyahSiswaModal({
  santri,
  onClose,
  onSave
}) {
  const [nilaiMapel, setNilaiMapel] = useState({ ...(santri.nilaiDiniyah || {}) });
  const [catatan, setCatatan] = useState(santri.catatanDiniyah || '');
  const [saving, setSaving] = useState(false);

  const handleScoreChange = (mapelId, val) => {
    if (val === '') {
      const updated = { ...nilaiMapel };
      delete updated[mapelId];
      setNilaiMapel(updated);
      return;
    }

    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setNilaiMapel(prev => ({ ...prev, [mapelId]: num }));
    }
  };

  const calc = hitungRaporDiniyah(nilaiMapel);
  const colorInfo = PREDIKAT_DINIYAH_COLORS[calc.predikatAkhir] || PREDIKAT_DINIYAH_COLORS['-'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(santri.id, nilaiMapel, catatan);
      onClose();
    } catch (err) {
      console.error('Gagal simpan nilai santri:', err);
      alert('Gagal menyimpan nilai ke sistem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '650px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Modal */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', color: '#ffffff', padding: '1rem 1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={18} color="#a5b4fc" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Input Nilai Diniyah Santriwati
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#e0e7ff', fontWeight: 600 }}>
              {santri.nama} • NIS: {santri.nis || santri.id} • {formatNamaKelas(santri.kelas)}
            </p>
          </div>
          <button className="btn-close" onClick={onClose} style={{ color: '#ffffff' }}>
            <X size={20} />
          </button>
        </div>

        {/* Banner Ringkasan Hasil Belajar */}
        <div style={{ padding: '0.85rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
          <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Total Nilai</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>{calc.total}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Rata-rata</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: calc.count > 0 ? '#15803d' : '#94a3b8' }}>
              {calc.count > 0 ? calc.rataRata : '—'}
            </div>
          </div>
          <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Predikat Akhir</div>
            <div className="arabic" style={{ fontSize: '1.05rem', fontWeight: 800, color: colorInfo.text }}>
              {calc.predikatAkhir}
            </div>
          </div>
        </div>

        {/* Body Modal: 8 Input Form Mata Pelajaran */}
        <div className="modal-body" style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
            {MATA_PELAJARAN_DINIYAH.map(m => {
              const val = nilaiMapel[m.id] ?? '';
              const pred = getPredikatDiniyah(val);
              const colorP = PREDIKAT_DINIYAH_COLORS[pred] || PREDIKAT_DINIYAH_COLORS['-'];

              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{m.labelId}</div>
                    <div className="arabic" style={{ fontSize: '0.85rem', color: '#4338ca', fontWeight: 600 }}>{m.labelAr}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0 - 100"
                      value={val}
                      onChange={(e) => handleScoreChange(m.id, e.target.value)}
                      style={{
                        width: '70px',
                        padding: '6px',
                        textAlign: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        borderRadius: '6px',
                        border: val !== '' ? '2px solid #4338ca' : '1.5px solid #cbd5e1',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    />
                    <div
                      className="arabic"
                      style={{
                        width: '65px',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        padding: '4px',
                        borderRadius: '4px',
                        background: colorP.bg,
                        color: colorP.text,
                        border: `1px solid ${colorP.border}`
                      }}
                    >
                      {pred || '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Catatan Evaluasi Guru Diniyah */}
          <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MessageSquare size={15} color="#4338ca" /> Catatan Pembina Diniyah:
              </label>
              <span style={{ fontSize: '0.75rem', color: (catatan || '').length >= 300 ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                {(catatan || '').length} / 300 karakter
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={300}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan evaluasi perkembangan pembelajaran kitab dan materi diniyah santriwati di sini..."
              className="catatan-pembina-textarea"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Footer Modal */}
        <div className="modal-footer" style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
            style={{ background: '#4338ca', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Nilai Santri'}
          </button>
        </div>

      </div>
    </div>
  );
}
