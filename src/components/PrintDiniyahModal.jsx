import React, { useState, useEffect } from 'react';
import { X, Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { formatNamaKelas } from '../utils/tahfidzCalc';
import DiniyahRaporA4Sheet from './DiniyahRaporA4Sheet';

export default function PrintDiniyahModal({
  santri,
  ranking,
  onClose,
  currentPeriod,
  currentUser
}) {
  const initialSem = currentPeriod?.semester === 'Genap' ? 'الثاني' : (santri.semester || 'الأول');
  const [selectedSemester, setSelectedSemester] = useState(initialSem);
  const [zoom, setZoom] = useState(1);
  const isAdmin = currentUser?.role === 'admin';

  // Listener keyboard ESC untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    if (!isAdmin) return;
    window.print();
  };

  // Cegah pintasan cetak Ctrl+P jika akun Guru (Hanya Lihat)
  useEffect(() => {
    if (isAdmin) return;
    const preventPrint = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', preventPrint, true);
    return () => window.removeEventListener('keydown', preventPrint, true);
  }, [isAdmin]);

  const hasRank = ranking !== '-' && ranking !== undefined && ranking !== null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content print-modal-container ${!isAdmin ? 'guru-view-only-lock' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar Aksi Header Modern & Sleek (Identik Tahfidz) */}
        <div className="modal-header print-modal-header no-print">
          <div className="print-modal-title-box">
            <div className="print-header-top-row">
              <span className={`print-badge-pill ${isAdmin ? 'admin' : 'guru'}`}>
                {isAdmin ? '👑 Mode Cetak Admin' : '👁️ Pratinjau Guru (Hanya Lihat)'}
              </span>
              <span className="print-student-info-chip">
                {santri.nama} • {formatNamaKelas(santri.kelas)} {hasRank && `• Peringkat #${ranking}`}
              </span>
            </div>
            <h2 className="print-modal-heading">
              {isAdmin ? 'RAPOR DINIYAH (A4 Formal Bersama Kop)' : 'PRATINJAU RAPOR DINIYAH (HANYA LIHAT)'}
            </h2>
          </div>

          <div className="print-modal-right-section">
            <div className="print-modal-actions">
              {/* Zoom / Scale Controls */}
              <div className="print-zoom-controls">
                <button 
                  type="button" 
                  className="btn-zoom" 
                  onClick={() => setZoom(prev => Math.max(0.6, +(prev - 0.1).toFixed(1)))} 
                  title="Perkecil Ukuran Lembar"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                <button 
                  type="button" 
                  className="btn-zoom" 
                  onClick={() => setZoom(prev => Math.min(1.2, +(prev + 0.1).toFixed(1)))} 
                  title="Perbesar Ukuran Lembar"
                >
                  <ZoomIn size={14} />
                </button>
                {zoom !== 1 && (
                  <button 
                    type="button" 
                    className="btn-zoom-reset" 
                    onClick={() => setZoom(1)} 
                    title="Kembalikan ke 100%"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>

              {/* Semester Selector */}
              <div className="print-semester-select">
                <label>Semester:</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="الأول">Ganjil 1 (الأول)</option>
                  <option value="الثاني">Genap 2 (الثاني)</option>
                </select>
              </div>

              {isAdmin ? (
                <button className="btn btn-primary btn-print-main" onClick={handlePrint}>
                  <Printer size={16} /> Cetak Dokumen (A4)
                </button>
              ) : (
                <div 
                  className="guru-view-only-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#64748b'
                  }}
                  title="Akses cetak fisik rapor resmi hanya dimiliki oleh Admin"
                >
                  <span>🔒 Hanya Lihat</span>
                </div>
              )}
            </div>

            {/* Tombol X Merah Background Putih di Ujung Kanan */}
            <button 
              type="button" 
              className="btn-modal-close-corner" 
              onClick={onClose} 
              title="Tutup"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dokumen Rapor Siap Cetak A4 */}
        <div className="modal-body print-modal-body">
          <div 
            className="print-paper-wrapper"
            style={{ 
              transform: zoom !== 1 ? `scale(${zoom})` : 'none',
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
          >
            <DiniyahRaporA4Sheet
              santri={santri}
              ranking={ranking}
              currentPeriod={currentPeriod}
              selectedSemester={selectedSemester}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
