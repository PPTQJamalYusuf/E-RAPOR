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
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: calc.count > 0 ? '#1e293b' : '#94a3b8' }}>
              {calc.count > 0 ? calc.total : '—'}
            </div>
          </div>
          <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Rata-rata</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: calc.count > 0 ? '#15803d' : '#94a3b8' }}>
              {calc.count > 0 ? calc.rataRata : '—'}
            </div>
          </div>
          <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Predikat Akhir</div>
            <div className="arabic" style={{ fontSize: '1.05rem', fontWeight: 800, color: calc.count > 0 ? colorInfo.text : '#94a3b8' }}>
              {calc.count > 0 ? calc.predikatAkhir : '—'}
            </div>
          </div>
        </div>

        {/* Body Modal: Tabel 8 Mata Pelajaran (Kebawah Vertikal) */}
        <div className="modal-body" style={{ padding: '0.85rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          <table className="santri-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ width: '45px', textAlign: 'center', padding: '8px' }}>No</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Mata Pelajaran</th>
                <th style={{ width: '110px', textAlign: 'center', padding: '8px' }}>Nilai</th>
                <th style={{ width: '130px', textAlign: 'center', padding: '8px' }}>Predikat</th>
              </tr>
            </thead>
            <tbody>
              {MATA_PELAJARAN_DINIYAH.map((m, idx) => {
                const val = nilaiMapel[m.id] ?? '';
                const pred = getPredikatDiniyah(val);
                const colorP = PREDIKAT_DINIYAH_COLORS[pred] || PREDIKAT_DINIYAH_COLORS['-'];

                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600, padding: '8px' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                          {m.labelId}
                        </span>
                        <span className="arabic" style={{ fontSize: '0.95rem', color: '#4338ca', fontWeight: 700 }}>
                          {m.labelAr}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder=""
                        value={val}
                        onChange={(e) => handleScoreChange(m.id, e.target.value)}
                        style={{
                          width: '75px',
                          padding: '6px 8px',
                          textAlign: 'center',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          borderRadius: '6px',
                          border: val !== '' ? '2px solid #4338ca' : '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          outline: 'none',
                          color: '#1e293b'
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                      {val !== '' ? (
                        <span
                          className="arabic"
                          style={{
                            display: 'inline-block',
                            minWidth: '85px',
                            textAlign: 'center',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: colorP.bg,
                            color: colorP.text,
                            border: `1px solid ${colorP.border}`
                          }}
                        >
                          {pred}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontWeight: 600 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
