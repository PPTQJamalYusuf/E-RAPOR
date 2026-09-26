import React, { useState } from 'react';
import { X, Calendar, Plus, Check } from 'lucide-react';
import { addAcademicPeriod } from '../lib/supabase';

export default function SemesterModal({ onClose, onCreated }) {
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [semester, setSemester] = useState('Genap');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tahunAjaran.trim()) {
      setErrorMsg('Tahun ajaran tidak boleh kosong!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const newP = await addAcademicPeriod(tahunAjaran.trim(), semester);
      onCreated(newP);
      onClose();
    } catch (err) {
      setErrorMsg('Gagal menambahkan periode semester.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Tambah Semester Baru</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Membuka periode penilaian baru untuk santriwati
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px 24px' }}>
            {errorMsg && (
              <div className="login-error-banner" style={{ marginBottom: '14px' }}>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Tahun Ajaran</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 2026/2027 atau 2027/2028"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Semester</label>
              <select
                className="form-control"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="Ganjil">Semester Ganjil (الأول / 1)</option>
                <option value="Genap">Semester Genap (الثاني / 2)</option>
              </select>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', color: '#64748b', border: '1px solid #e2e8f0' }}>
              💡 <strong>Catatan:</strong> Seluruh 105 data santriwati akan otomatis tersedia di semester baru ini dengan lembar nilai yang baru. Data semester sebelumnya tetap aman tersimpan sebagai riwayat.
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : '+ Buat Semester'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
