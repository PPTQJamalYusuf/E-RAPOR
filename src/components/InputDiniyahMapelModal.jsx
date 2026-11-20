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
      <div className="modal-content input-diniyah-modal-content" style={{ maxWidth: '820px' }}>
        
        {/* Header Modal */}
        <div className="modal-header diniyah-modal-header" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', color: '#ffffff', padding: '1rem 1.25rem', flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#a5b4fc" style={{ flexShrink: 0 }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Input Nilai Diniyah Per Mapel
              </h2>
            </div>
            <p className="diniyah-enter-hint" style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#c7d2fe' }}>
              Ketik nilai lalu tekan <strong>Enter [↵]</strong> untuk langsung pindah ke santri berikutnya ala Excel.
            </p>
          </div>
          <button 
            type="button" 
            className="btn-modal-close-red" 
            onClick={onClose} 
            title="Tutup (ESC)"
            aria-label="Tutup Modal"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Filter Pilih Kelas & Mata Pelajaran */}
        <div className="diniyah-mapel-filterbar" style={{ padding: '0.75rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div className="diniyah-mapel-selects" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="diniyah-select-group">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', background: '#ffffff' }}
              >
                {['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'].map(k => (
                  <option key={k} value={k}>{formatNamaKelas(k)}</option>
                ))}
              </select>
            </div>

            <div className="diniyah-select-group">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>Mata Pelajaran:</span>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #6366f1', background: '#e0e7ff', fontWeight: 800, fontSize: '0.88rem', color: '#312e81' }}
              >
                {MATA_PELAJARAN_DINIYAH.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.labelId} ({m.labelAr})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="diniyah-santri-count" style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'right' }}>
            Jumlah: <strong style={{ color: '#1e293b' }}>{santriKelas.length}</strong> santri
          </div>
        </div>

        {/* Body Modal: Tabel Daftar Santri & Kotak Nilai */}
        <div className="modal-body diniyah-modal-body" style={{ padding: '0.75rem 1.25rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {savedSuccess && (
            <div style={{ padding: '8px 12px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700 }}>
              <CheckCircle size={16} /> Nilai mapel {mapelInfo.labelId} berhasil disimpan ke sistem!
            </div>
          )}

          <div className="diniyah-table-scroll">
            <table className="santri-table diniyah-mapel-table" style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th className="col-hide-mobile" style={{ width: '42px', textAlign: 'center' }}>No</th>
                  <th className="col-hide-mobile" style={{ width: '90px' }}>NIS</th>
                  <th>Nama Santriwati</th>
                  <th className="col-diniyah-nilai" style={{ width: '92px', textAlign: 'center' }}>Nilai</th>
                  <th className="col-diniyah-pred" style={{ width: '100px', textAlign: 'center' }}>Predikat</th>
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
                        <td className="col-hide-mobile" style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                        <td className="col-hide-mobile" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{santri.nis || santri.id}</td>
                        <td style={{ fontWeight: 600 }}>
                          <div>{santri.nama}</div>
                          <div className="diniyah-nis-mobile-sub">{santri.nis || santri.id}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            ref={el => inputRefs.current[idx] = el}
                            type="number"
                            inputMode="numeric"
                            min="0"
                            max="100"
                            placeholder=""
                            value={val}
                            onChange={(e) => handleScoreChange(santri.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            onFocus={(e) => e.target.select()}
                            enterKeyHint="next"
                            className="diniyah-score-input"
                            style={{
                              border: val !== '' ? '2px solid #4338ca' : '1.5px solid #cbd5e1',
                              background: val !== '' ? '#f5f3ff' : '#ffffff',
                              color: '#1e1b4b'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="predikat-pill arabic diniyah-pred-badge"
                            style={{
                              background: colorInfo.bg,
                              color: colorInfo.text,
                              border: `1px solid ${colorInfo.border}`
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
        </div>

        {/* Footer Modal (Sticky & Safe-Area di HP) */}
        <div className="modal-footer input-diniyah-mapel-footer" style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div className="diniyah-enter-hint" style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDown size={14} /> Tekan <strong>Enter</strong> untuk loncat otomatis ke santri berikutnya.
          </div>

          <div className="diniyah-footer-actions" style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Batal
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
