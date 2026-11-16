import React, { useState, useEffect, useRef } from 'react';
import { X, Save, CheckCircle, ArrowDown, HelpCircle, BookOpen } from 'lucide-react';
import { MATA_PELAJARAN_DINIYAH, getPredikatDiniyah, PREDIKAT_DINIYAH_COLORS } from '../utils/diniyahCalc';
import { formatNamaKelas } from '../utils/tahfidzCalc';

export default function InputDiniyahMapelModal({
  initialKelas = 'الأول',
  santriList = [],
  onClose,
  onSaveBatch
}) {
  const [selectedKelas, setSelectedKelas] = useState(initialKelas);
  const [selectedMapel, setSelectedMapel] = useState('tauhid');
  const [scores, setScores] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Daftar santri di kelas yang dipilih
  const santriKelas = useMemoSantri(santriList, selectedKelas);

  // Input refs untuk navigasi keyboard Enter (loncat ke santri berikutnya)
  const inputRefs = useRef([]);

  // Muat nilai mapel santri kelas yang dipilih
  useEffect(() => {
    const initialMap = {};
    santriKelas.forEach(s => {
      const val = s.nilaiDiniyah?.[selectedMapel];
      initialMap[s.id] = (val !== undefined && val !== null) ? val : '';
    });
    setScores(initialMap);
    setIsDirty(false);
    setSavedSuccess(false);
  }, [selectedKelas, selectedMapel, santriKelas]);

  const handleScoreChange = (santriId, val) => {
    if (val === '') {
      setScores(prev => ({ ...prev, [santriId]: '' }));
      setIsDirty(true);
      return;
    }

    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setScores(prev => ({ ...prev, [santriId]: num }));
      setIsDirty(true);
    }
  };

  // Navigasi Keyboard: Tekan Enter / Panah Bawah langsung fokus ke input anak berikutnya
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) prevInput.focus();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = santriKelas.map(s => ({
      santriId: s.id,
      nilai: scores[s.id] !== undefined ? scores[s.id] : ''
    }));

    try {
      await onSaveBatch(selectedMapel, updates);
      setIsDirty(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Gagal simpan batch:', err);
      alert('Terjadi kendala saat menyimpan nilai.');
    } finally {
      setSaving(false);
    }
  };

  const mapelInfo = MATA_PELAJARAN_DINIYAH.find(m => m.id === selectedMapel) || MATA_PELAJARAN_DINIYAH[0];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isDirty) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '820px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Modal */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', color: '#ffffff', padding: '1rem 1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#a5b4fc" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Lembar Input Nilai Diniyah Cepat (Per Mapel)
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#c7d2fe' }}>
              Ketik nilai lalu tekan <strong>Enter [↵]</strong> untuk langsung pindah ke santri berikutnya ala Excel.
            </p>
          </div>
          <button className="btn-close" onClick={onClose} style={{ color: '#ffffff' }}>
            <X size={20} />
          </button>
        </div>

        {/* Filter Pilih Kelas & Mata Pelajaran */}
        <div style={{ padding: '0.85rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>Pilih Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}
              >
                {['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'].map(k => (
                  <option key={k} value={k}>{formatNamaKelas(k)}</option>
                ))}
              </select>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>Mata Pelajaran (Mapel):</span>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                style={{ padding: '5px 12px', borderRadius: '6px', border: '1.5px solid #6366f1', background: '#e0e7ff', fontWeight: 800, fontSize: '0.88rem', color: '#312e81' }}
              >
                {MATA_PELAJARAN_DINIYAH.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.labelId} ({m.labelAr})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'right' }}>
            Jumlah Santri: <strong style={{ color: '#1e293b' }}>{santriKelas.length}</strong> anak
          </div>
        </div>

        {/* Body Modal: Tabel Daftar Santri & Kotak Nilai */}
        <div className="modal-body" style={{ padding: '0.75rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {savedSuccess && (
            <div style={{ padding: '8px 12px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700 }}>
              <CheckCircle size={16} /> Nilai mapel {mapelInfo.labelId} berhasil disimpan ke sistem!
            </div>
          )}

          <table className="santri-table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                <th style={{ width: '90px' }}>NIS</th>
                <th>Nama Santriwati</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Nilai (0 - 100)</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Predikat</th>
              </tr>
            </thead>
            <tbody>
              {santriKelas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Tidak ada santriwati di {formatNamaKelas(selectedKelas)}.
                  </td>
                </tr>
              ) : (
                santriKelas.map((santri, idx) => {
                  const val = scores[santri.id] ?? '';
                  const pred = getPredikatDiniyah(val);
                  const colorInfo = PREDIKAT_DINIYAH_COLORS[pred] || PREDIKAT_DINIYAH_COLORS['-'];

                  return (
                    <tr key={santri.id}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{santri.nis || santri.id}</td>
                      <td style={{ fontWeight: 600 }}>{santri.nama}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          ref={el => inputRefs.current[idx] = el}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="100"
                          placeholder="—"
                          value={val}
                          onChange={(e) => handleScoreChange(santri.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            borderRadius: '6px',
                            border: val !== '' ? '2px solid #4338ca' : '1.5px solid #cbd5e1',
                            background: val !== '' ? '#f5f3ff' : '#ffffff',
                            color: '#1e1b4b',
                            outline: 'none'
                          }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="predikat-pill arabic"
                          style={{
                            background: colorInfo.bg,
                            color: colorInfo.text,
                            border: `1px solid ${colorInfo.border}`,
                            padding: '3px 8px',
                            fontSize: '0.85rem'
                          }}
                        >
                          {pred || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Modal */}
        <div className="modal-footer" style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDown size={14} /> Tekan <strong>Enter</strong> untuk loncat otomatis ke santri berikutnya.
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Batal / Tutup
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ background: '#4338ca', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1.25rem', fontWeight: 700 }}
            >
              <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Nilai Kelas'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function useMemoSantri(santriList, selectedKelas) {
  return React.useMemo(() => {
    return santriList.filter(s => {
      if (selectedKelas === 'Semua') return true;
      if (selectedKelas === 'Alumni' || selectedKelas === 'alumni') {
        return s.kelas === 'Alumni' || s.kelas === 'alumni' || s.status === 'alumni';
      }
      return s.kelas === selectedKelas;
    });
  }, [santriList, selectedKelas]);
}
