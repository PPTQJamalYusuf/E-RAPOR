import React, { useState, useEffect } from 'react';
import { X, Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { 
  getPredikat, 
  hitungRapor, 
  KELAS_BILINGUAL, 
  SEMESTER_BILINGUAL,
  PREDIKAT_LABEL_ID 
} from '../utils/tahfidzCalc';

export default function PrintRaporModal({ santri, ranking, onClose, currentPeriod, currentUser }) {
  const initialSem = currentPeriod?.semester === 'Genap' ? 'الثاني' : (santri.semester || 'الأول');
  const [selectedSemester, setSelectedSemester] = useState(initialSem);
  const [zoom, setZoom] = useState(1);
  const calc = hitungRapor(santri.nilaiJuz || {});
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

  // Tahun Pelajaran dinamis dari periode aktif atau tanggal
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const defaultTahunPelajaran = `${startYear} / ${startYear + 1}`;
  const tahunPelajaran = currentPeriod?.tahun_ajaran || santri.tahunPelajaran || santri.tahun_pelajaran || defaultTahunPelajaran;

  const handlePrint = () => {
    window.print();
  };

  const toArabicNum = (n) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return n.toString().split('').map(d => arabicDigits[d] || d).join('');
  };

  const formatJumlahHafalan = (val, count) => {
    if (val && String(val).trim() !== '') {
      const trimmed = String(val).trim();
      const matchNum = trimmed.match(/^(\d+)(\s*Juz)?$/i);
      if (matchNum) {
        const n = matchNum[1];
        return `Juz ${toArabicNum(n)}`;
      }
      return trimmed;
    }
    return count > 0 ? `Juz ${toArabicNum(count)}` : 'Belum Diuji (—)';
  };

  // Render Tabel Vertikal: Juz startJuz s/d endJuz
  const renderSplitVerticalTable = (startJuz, endJuz) => {
    const juzRange = [];
    for (let j = startJuz; j <= endJuz; j++) {
      juzRange.push(j);
    }

    return (
      <table className="table-split-vertical">
        <thead>
          <tr>
            <th style={{ width: '38%' }}>
              <span>Juz</span>
              <span className="arabic" style={{ fontSize: '10pt', marginLeft: '4px' }}>الجزء</span>
            </th>
            <th style={{ width: '28%' }}>
              <span>Nilai</span>
              <span className="arabic" style={{ fontSize: '10pt', marginLeft: '4px' }}>الدرجة</span>
            </th>
            <th style={{ width: '34%' }}>
              <span>Predikat</span>
              <span className="arabic" style={{ fontSize: '10pt', marginLeft: '4px' }}>التقدير</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {juzRange.map(j => {
            const val = santri.nilaiJuz?.[j];
            const hasVal = val !== undefined && val !== null && val !== '';
            const pred = hasVal ? getPredikat(val) : '';
            return (
              <tr key={j}>
                <td className="cell-split-juz">
                  Juz {toArabicNum(j)}
                </td>
                <td className={`cell-split-nilai ${hasVal ? 'has-val' : 'is-empty'}`}>
                  {hasVal ? val : '—'}
                </td>
                <td className={`cell-split-pred ${hasVal ? '' : 'is-empty'}`}>
                  {hasVal ? pred : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content print-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Toolbar Aksi Header Modern & Sleek */}
        <div className="modal-header print-modal-header no-print">
          <div className="print-modal-title-box">
            <div className="print-header-top-row">
              <span className={`print-badge-pill ${isAdmin ? 'admin' : 'guru'}`}>
                {isAdmin ? '👑 Mode Cetak Admin' : '👩‍🏫 Pratinjau Ustadzah'}
              </span>
              <span className="print-student-info-chip">
                {santri.nama} • {KELAS_BILINGUAL[santri.kelas] || santri.kelas} {ranking !== '-' && `• Peringkat #${ranking}`}
              </span>
            </div>
            <h2 className="print-modal-heading">
              {isAdmin ? 'RAPOR TAHFIDZ (A4 Formal Bersama Kop)' : 'PRATINJAU DOKUMEN RAPOR TAHFIDZ'}
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
                <button className="btn btn-info btn-print-main" onClick={handlePrint} title="Cetak salinan atau simpan PDF pratinjau">
                  <Printer size={16} /> Cetak / PDF
                </button>
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
            <div className="rapor-a4-formal">
            {/* 1. KOP PONDOK RESMI */}
            <div className="letterhead-wrapper">
              <img
                src="/kop-pondok.png"
                alt="Pusat Tahfidzul Qur'an Jamal Al-Haddad Tulang Bawang"
                className="letterhead-img"
              />
            </div>

            {/* SPASI 1: Setelah kop (jarak proporsional agar judul tidak mepet ke header kop) */}
            <div className="spacer-header-top"></div>

            {/* 2. JUDUL DOKUMEN: KALIGRAFI ARAB DI ATAS, INDO "RAPOR TAHFIDZ" DI BAWAH */}
            <div className="doc-header-formal">
              <div className="arabic title-ar">كَشْفُ دَرَجَاتِ تَحْفِيْظِ الْقُرْآنِ الْكَرِيْمِ</div>
              <h1 className="doc-title-formal title-rapor-tahfidz">Rapor Tahfidz</h1>
            </div>

            {/* SPASI 2: Setelah header (spasi 2 ke bawah lebih lapang) */}
            <div className="spacer-header-bottom"></div>

            {/* 3. DATA SANTRI (Font Jelas 10.2pt & Rapi Tanpa Wrapping) */}
            <table className="student-info-formal-lg">
              <tbody>
                <tr>
                  <td className="info-label">
                    Nama Santri <span className="ar-label-inline">الإسم</span>
                  </td>
                  <td className="info-colon">:</td>
                  <td className="info-val bold">{santri.nama}</td>

                  <td className="info-label">
                    Kelas <span className="ar-label-inline">المستوى</span>
                  </td>
                  <td className="info-colon">:</td>
                  <td className="info-val bold">
                    {KELAS_BILINGUAL[santri.kelas] || santri.kelas}
                  </td>
                </tr>
                <tr>
                  <td className="info-label">
                    Nomor Induk <span className="ar-label-inline">رقم القيد</span>
                  </td>
                  <td className="info-colon">:</td>
                  <td className="info-val">{santri.nis || santri.id}</td>

                  <td className="info-label">
                    Semester <span className="ar-label-inline">الفصل</span>
                  </td>
                  <td className="info-colon">:</td>
                  <td className="info-val">
                    {SEMESTER_BILINGUAL[selectedSemester] || selectedSemester || 'Ganjil (الأول)'}
                  </td>
                </tr>
                <tr>
                  <td className="info-label">
                    Tahun Pelajaran <span className="ar-label-inline">العام</span>
                  </td>
                  <td className="info-colon">:</td>
                  <td className="info-val">{tahunPelajaran}</td>

                  <td className="info-label">
                    Jumlah Hafalan <span className="ar-label-inline">عدد الحفظ</span>
                  </td>
                  <td className="info-colon">:</td>
                  <td className="info-val bold">
                    {formatJumlahHafalan(santri.jumlahHafalan, calc.count)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 4. TABEL 2 KOLOM VERTIKAL: JUZ 1-15 (KIRI) & JUZ 16-30 (KANAN) */}
            <div className="section-title-formal">
              <span>A. Capaian Hafalan Al-Qur'an 30 Juz</span>
              <span className="arabic" style={{ fontSize: '10.5pt', fontWeight: 'bold' }}>أ. درجات حفظ ثلاثين جزءا</span>
            </div>

            <div className="tabel-split-vertical-wrapper">
              <div className="tabel-split-col">
                {renderSplitVerticalTable(1, 15)}
              </div>
              <div className="tabel-split-col">
                {renderSplitVerticalTable(16, 30)}
              </div>
            </div>

            {/* 5. RINGKASAN HASIL BELAJAR & PERINGKAT (BAHASA INDONESIA) */}
            <div className="section-title-formal" style={{ marginTop: '2px' }}>
              <span>B. Ringkasan Hasil Belajar & Peringkat</span>
            </div>

            <div className="summary-cards-4col">
              <div className="summary-card-item">
                <div className="summary-card-label">
                  <span>Total Nilai</span>
                </div>
                <div className="summary-card-val">{calc.total}</div>
              </div>

              <div className="summary-card-item">
                <div className="summary-card-label">
                  <span>Nilai Rata-rata</span>
                </div>
                <div className="summary-card-val highlight-green">
                  {calc.count > 0 ? calc.rataRata : '—'}
                </div>
              </div>

              <div className="summary-card-item">
                <div className="summary-card-label">
                  <span>Predikat Akhir</span>
                </div>
                <div className="summary-card-val" style={{ color: '#047857', fontSize: '11pt', fontWeight: 800 }}>
                  {calc.count > 0 ? (PREDIKAT_LABEL_ID[calc.predikatAkhir] || calc.predikatAkhir) : '—'}
                </div>
              </div>

              <div className="summary-card-item">
                <div className="summary-card-label">
                  <span>Peringkat Kelas</span>
                </div>
                <div className="summary-card-val highlight-gold">
                  {ranking !== '-' ? `#${ranking}` : '—'}
                </div>
              </div>
            </div>

            {/* 6. LEGENDA KRITERIA KELULUSAN HORIZONTAL (HEMAT RUANG) */}
            <div className="legenda-kriteria-horizontal">
              <div className="legenda-title">
                <span>Kriteria Kelulusan <span className="arabic">(معيار التقدير)</span>:</span>
              </div>
              <div className="legenda-items">
                <span className="legenda-chip">95–100: <strong className="arabic">ممتاز</strong> (Sangat Baik)</span>
                <span className="legenda-chip">90–94: <strong className="arabic">جيّد جدا</strong> (Baik Sekali)</span>
                <span className="legenda-chip">85–89: <strong className="arabic">جيّد</strong> (Baik)</span>
                <span className="legenda-chip">80–84: <strong className="arabic">مقبول</strong> (Cukup)</span>
                <span className="legenda-chip">&lt;80: <strong className="arabic">راسب</strong> (Mengulang)</span>
              </div>
            </div>

            {/* 7. CATATAN */}
            <div className="catatan-box-formal">
              <div className="catatan-title-formal">
                <span>C. Catatan</span>
              </div>
              <div className="catatan-content-formal" style={{ fontSize: '10pt', lineHeight: 1.5, minHeight: '22px' }}>
                {santri.catatan || ''}
              </div>
              <div className="catatan-dotted-line"></div>
            </div>

            {/* SPASI 4: Form ttd */}
            <div className="spacer-3"></div>

            {/* 8. TANDA TANGAN RESMI */}
            {/* 8. TANDA TANGAN RESMI (SEJAJAR PRESISI) */}
            <div className="signature-container-formal">
              <div className="signature-col-formal">
                <div className="sig-role-formal">
                  Mengetahui, <span className="arabic">(معرفة)</span>
                </div>
                <div className="sig-role-formal bold">
                  Orang Tua / Wali Santri <span className="arabic">(ولي الطالبة)</span>
                </div>
                <div className="sig-space-formal"></div>
                <div className="sig-name-box">
                  <div className="sig-name-ar-spacer">&nbsp;</div>
                  <div className="sig-line-formal">
                    ( <span className="sig-solid-line"></span> )
                  </div>
                </div>
              </div>

              <div className="signature-col-formal">
                <div className="sig-date-formal">
                  Tulang Bawang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="sig-role-formal bold">
                  Pembina Tahfidz <span className="arabic">(رئيسة قسم التحفيظ)</span>
                </div>
                <div className="sig-space-formal"></div>
                <div className="sig-name-box">
                  <div className="arabic sig-name-ar">يينى رحمواتـى</div>
                  <div className="sig-name-latin">YENI RAHMAWATI</div>
                </div>
              </div>
            </div>

            {/* 9. FOOTER DOKUMEN RESMI (Bawah Mentok) */}
            <div className="doc-footer-formal">
              <span>E-Rapor Tahfidz PPTQ Jamal Yusuf Al-Haddad Tahun {new Date().getFullYear()}</span>
            </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
