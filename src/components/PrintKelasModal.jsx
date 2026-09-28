import React, { useState, useMemo, useEffect } from 'react';
import { X, Printer, Users, BookOpen, Award, CheckCircle2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { 
  getPredikat, 
  hitungRapor, 
  hitungRanking, 
  KELAS_BILINGUAL, 
  SEMESTER_BILINGUAL,
  PREDIKAT_LABEL_ID,
  PREDIKAT_COLORS
} from '../utils/tahfidzCalc';

export default function PrintKelasModal({ santriList, initialKelas, currentPeriod, onClose }) {
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

  const kelasList = useMemo(() => {
    const set = new Set();
    // Prioritas urutan kelas standar pondok
    const standard = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    standard.forEach(k => {
      if (santriList.some(s => s.kelas === k)) {
        set.add(k);
      }
    });
    // Tambahkan kelas lainnya jika ada
    santriList.forEach(s => {
      if (s.kelas) set.add(s.kelas);
    });
    // Fallback jika belum ada data santri
    if (set.size === 0) {
      standard.forEach(k => set.add(k));
    }
    return Array.from(set);
  }, [santriList]);

  const validInitialKelas = kelasList.includes(initialKelas) 
    ? initialKelas 
    : (kelasList[0] || 'الأول');
  
  const [selectedKelas, setSelectedKelas] = useState(validInitialKelas);
  const [printMode, setPrintMode] = useState('batch'); // 'batch' (seluruh rapor) atau 'leger' (rekap nilai)
  const [zoom, setZoom] = useState(1);

  const initialSem = currentPeriod?.semester === 'Genap' ? 'الثاني' : 'الأول';
  const [selectedSemester, setSelectedSemester] = useState(initialSem);

  // Tahun Pelajaran dinamis
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const defaultTahunPelajaran = `${startYear} / ${startYear + 1}`;
  const tahunPelajaran = currentPeriod?.tahun_ajaran || defaultTahunPelajaran;

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

  // Filter santri berdasarkan kelas yang dipilih dan urutkan ranking
  const santriKelas = useMemo(() => {
    const filtered = santriList.filter(s => s.kelas === selectedKelas);
    return hitungRanking(filtered);
  }, [santriList, selectedKelas]);

  // Statistik Kelas untuk Leger
  const statsKelas = useMemo(() => {
    const total = santriKelas.length;
    let totalNilaiKelas = 0;
    let countDinilai = 0;
    let tuntasCount = 0;
    let nilaiTertinggi = 0;

    santriKelas.forEach(s => {
      const calc = s.calc || hitungRapor(s.nilaiJuz || {});
      if (calc.count > 0) {
        countDinilai++;
        totalNilaiKelas += parseFloat(calc.rataRata);
        if (parseFloat(calc.rataRata) > nilaiTertinggi) {
          nilaiTertinggi = parseFloat(calc.rataRata);
        }
        if (calc.predikatAkhir !== 'راسب') {
          tuntasCount++;
        }
      }
    });

    return {
      total,
      countDinilai,
      rataRataKelas: countDinilai > 0 ? (totalNilaiKelas / countDinilai).toFixed(1) : '—',
      nilaiTertinggi: countDinilai > 0 ? nilaiTertinggi.toFixed(1) : '—',
      persenTuntas: countDinilai > 0 ? Math.round((tuntasCount / countDinilai) * 100) : 0
    };
  }, [santriKelas]);

  // Render Tabel Vertikal Juz startJuz s/d endJuz untuk satu santri
  const renderSplitVerticalTable = (santri, startJuz, endJuz) => {
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
                  {hasVal ? (
                    <span>
                      <span className="arabic" style={{ fontSize: '10pt', fontWeight: 'bold' }}>{pred}</span>
                      {' '}
                      <span style={{ fontSize: '7.5pt', fontFamily: 'Calibri, sans-serif', fontWeight: 600, color: '#166534' }}>
                        ({PREDIKAT_LABEL_ID[pred] || pred})
                      </span>
                    </span>
                  ) : '—'}
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
              <span className="print-badge-pill admin">
                👑 Mode Cetak Admin
              </span>
              <span className="print-student-info-chip">
                Kelas: {KELAS_BILINGUAL[selectedKelas] || selectedKelas} • {santriKelas.length} Santriwati
              </span>
            </div>
            <h2 className="print-modal-heading">
              CETAK PER KELAS — PPTQ JAMAL YUSUF
            </h2>
          </div>

          <div className="print-modal-right-section">
            <div className="print-modal-actions">
              {/* Pilihan Mode Cetak (Segmented Tabs) */}
              <div className="print-mode-toggle-group">
                <button
                  type="button"
                  className={`print-mode-btn ${printMode === 'batch' ? 'active' : ''}`}
                  onClick={() => setPrintMode('batch')}
                  title="Cetak seluruh lembar rapor A4 santriwati dalam kelas ini"
                >
                  <BookOpen size={14} /> Rapor Santri ({santriKelas.length})
                </button>
                <button
                  type="button"
                  className={`print-mode-btn ${printMode === 'leger' ? 'active' : ''}`}
                  onClick={() => setPrintMode('leger')}
                  title="Cetak tabel rekapitulasi nilai dan ranking 1 kelas"
                >
                  <Award size={14} /> Leger Nilai
                </button>
              </div>

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

              {/* Pilihan Kelas */}
              <div className="print-semester-select">
                <label>Kelas:</label>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                >
                  {kelasList.map(k => (
                    <option key={k} value={k}>
                      {KELAS_BILINGUAL[k] || `Kelas ${k}`} ({santriList.filter(s => s.kelas === k).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Semester */}
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

              <button className="btn btn-primary btn-print-main" onClick={handlePrint}>
                <Printer size={16} /> Cetak {printMode === 'batch' ? `Rapor (${santriKelas.length} Hal)` : 'Leger Nilai'}
              </button>
            </div>

            {/* Tombol X Merah Background Putih di Ujung Kanan */}
            <button 
              type="button" 
              className="btn-modal-close-corner" 
              onClick={onClose} 
              title="Tutup"
              aria-label="Tutup Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Isi Modal Cetak */}
        <div className="modal-body print-modal-body">
          <div 
            className="print-paper-wrapper"
            style={{ 
              transform: zoom !== 1 ? `scale(${zoom})` : 'none',
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
          >
          {santriKelas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#fff', borderRadius: '12px' }}>
              Belum ada data santriwati yang terdaftar di kelas <strong>{selectedKelas}</strong>.
            </div>
          ) : printMode === 'batch' ? (
            /* MODE 1: BATCH PRINT SELURUH RAPOR SANTRI DALAM KELAS (1 SANTRI 1 HALAMAN A4) */
            <div className="batch-rapor-container">
              {santriKelas.map((santri, sIdx) => {
                const calc = santri.calc || hitungRapor(santri.nilaiJuz || {});
                const ranking = santri.ranking;

                return (
                  <div key={santri.id} className="batch-rapor-page">
                    <div className="rapor-a4-formal">
                      {/* 1. KOP PONDOK RESMI */}
                      <div className="letterhead-wrapper">
                        <img
                          src="/kop-pondok.png"
                          alt="Pusat Tahfidzul Qur'an Jamal Al-Haddad Tulang Bawang"
                          className="letterhead-img"
                        />
                      </div>

                      {/* SPASI 1: Setelah kop */}
                      <div className="spacer-header-top"></div>

                      {/* 2. JUDUL DOKUMEN */}
                      <div className="doc-header-formal">
                        <div className="arabic title-ar">كَشْفُ دَرَجَاتِ تَحْفِيْظِ الْقُرْآنِ الْكَرِيْمِ</div>
                        <h1 className="doc-title-formal title-rapor-tahfidz">Rapor Tahfidz</h1>
                      </div>

                      {/* SPASI 2 */}
                      <div className="spacer-header-bottom"></div>

                      {/* 3. DATA SANTRI */}
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

                      {/* 4. TABEL 2 KOLOM VERTIKAL: JUZ 1-15 & 16-30 */}
                      <div className="section-title-formal">
                        <span>A. Capaian Hafalan Al-Qur'an 30 Juz</span>
                      </div>

                      <div className="tabel-split-vertical-wrapper">
                        <div className="tabel-split-col">
                          {renderSplitVerticalTable(santri, 1, 15)}
                        </div>
                        <div className="tabel-split-col">
                          {renderSplitVerticalTable(santri, 16, 30)}
                        </div>
                      </div>

                      {/* 5. RINGKASAN HASIL BELAJAR & PERINGKAT */}
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
                            {calc.count > 0 ? (
                              <span>
                                <span className="arabic" style={{ fontSize: '12pt', fontWeight: 'bold' }}>
                                  {calc.predikatAkhir}
                                </span>
                                {' '}
                                <span style={{ fontSize: '8.5pt', fontWeight: 600, color: '#047857', fontFamily: 'Calibri, sans-serif' }}>
                                  ({PREDIKAT_LABEL_ID[calc.predikatAkhir] || calc.predikatAkhir})
                                </span>
                              </span>
                            ) : '—'}
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

                      {/* 6. LEGENDA KRITERIA KELULUSAN */}
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

                      {/* SPASI 4 */}
                      <div className="spacer-3"></div>

                      {/* 8. TANDA TANGAN RESMI */}
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

                      {/* 9. FOOTER DOKUMEN RESMI */}
                      <div className="doc-footer-formal">
                        <span>E-Rapor Tahfidz PPTQ Jamal Yusuf Al-Haddad • Hal. {sIdx + 1} dari {santriKelas.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MODE 2: REKAPITULASI LEGER NILAI & PERINGKAT 1 KELAS */
            <div className="rekap-kelas-a4">
              {/* Kop Pondok */}
              <div className="letterhead-wrapper">
                <img
                  src="/kop-pondok.png"
                  alt="Pusat Tahfidzul Qur'an Jamal Al-Haddad Tulang Bawang"
                  className="letterhead-img"
                />
              </div>

              <div className="spacer-header-top"></div>

              {/* Judul Dokumen */}
              <div className="doc-header-formal">
                <div className="arabic title-ar">كَشْفُ دَرَجَاتِ تَحْفِيْظِ الْقُرْآنِ الْكَرِيْمِ لِجَمِيْعِ الطَّالِبَاتِ</div>
                <h1 className="doc-title-formal title-rapor-tahfidz">
                  Rekapitulasi Nilai & Peringkat Tahfidz Kelas {selectedKelas}
                </h1>
              </div>

              <div className="spacer-header-bottom"></div>

              {/* Info Kelas & Periode */}
              <table className="student-info-formal-lg" style={{ marginBottom: '10px' }}>
                <tbody>
                  <tr>
                    <td className="info-label">Kelas / Tingkat</td>
                    <td className="info-colon">:</td>
                    <td className="info-val bold">{KELAS_BILINGUAL[selectedKelas] || selectedKelas}</td>

                    <td className="info-label">Semester</td>
                    <td className="info-colon">:</td>
                    <td className="info-val bold">{SEMESTER_BILINGUAL[selectedSemester] || selectedSemester}</td>
                  </tr>
                  <tr>
                    <td className="info-label">Tahun Pelajaran</td>
                    <td className="info-colon">:</td>
                    <td className="info-val">{tahunPelajaran}</td>

                    <td className="info-label">Total Santriwati</td>
                    <td className="info-colon">:</td>
                    <td className="info-val bold">{statsKelas.total} Orang</td>
                  </tr>
                </tbody>
              </table>

              {/* Ringkasan Statistik Kelas */}
              <div className="summary-cards-4col" style={{ marginBottom: '12px' }}>
                <div className="summary-card-item">
                  <div className="summary-card-label">Santri Dinilai</div>
                  <div className="summary-card-val">{statsKelas.countDinilai} / {statsKelas.total}</div>
                </div>
                <div className="summary-card-item">
                  <div className="summary-card-label">Rata-rata Kelas</div>
                  <div className="summary-card-val highlight-green">{statsKelas.rataRataKelas}</div>
                </div>
                <div className="summary-card-item">
                  <div className="summary-card-label">Nilai Tertinggi</div>
                  <div className="summary-card-val highlight-gold">{statsKelas.nilaiTertinggi}</div>
                </div>
                <div className="summary-card-item">
                  <div className="summary-card-label">Ketuntasan (≥80)</div>
                  <div className="summary-card-val" style={{ color: '#047857' }}>{statsKelas.persenTuntas}%</div>
                </div>
              </div>

              {/* Tabel Leger Nilai Kelas */}
              <table className="rekap-table-formal">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Rank</th>
                    <th style={{ width: '100px' }}>NIS</th>
                    <th>Nama Santriwati</th>
                    <th style={{ width: '110px' }}>Hafalan Teruji</th>
                    <th style={{ width: '90px' }}>Rata-rata</th>
                    <th style={{ width: '120px' }}>Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {santriKelas.map((santri, idx) => {
                    const calc = santri.calc || hitungRapor(santri.nilaiJuz || {});
                    const colorInfo = PREDIKAT_COLORS[calc.predikatAkhir] || PREDIKAT_COLORS['-'];

                    return (
                      <tr key={santri.id}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {santri.ranking === 1 ? (
                            <span className="rank-badge rank-gold">🥇 1</span>
                          ) : santri.ranking === 2 ? (
                            <span className="rank-badge rank-silver">🥈 2</span>
                          ) : santri.ranking === 3 ? (
                            <span className="rank-badge rank-bronze">🥉 3</span>
                          ) : (
                            <span className="rank-badge-normal">
                              {santri.ranking !== '-' ? `#${santri.ranking}` : idx + 1}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '8.5pt' }}>{santri.nis || santri.id}</td>
                        <td style={{ fontWeight: 600 }}>{santri.nama}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>
                          {calc.count > 0 ? `${calc.count} Juz` : '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: calc.count > 0 ? '#15803d' : '#94a3b8' }}>
                          {calc.count > 0 ? calc.rataRata : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="predikat-pill"
                            style={{
                              background: colorInfo.bg,
                              color: colorInfo.text,
                              border: `1px solid ${colorInfo.border}`,
                              fontSize: '8pt',
                              padding: '2px 6px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <strong className="arabic">{calc.predikatAkhir}</strong> {PREDIKAT_LABEL_ID[calc.predikatAkhir] ? `(${PREDIKAT_LABEL_ID[calc.predikatAkhir]})` : ''}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Tanda Tangan Formal */}
              <div className="signature-container-formal" style={{ marginTop: '24px' }}>
                <div className="signature-col-formal">
                  <div className="sig-role-formal">
                    Mengetahui, <span className="arabic">(معرفة)</span>
                  </div>
                  <div className="sig-role-formal bold">
                    Mudir
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

              {/* Footer */}
              <div className="doc-footer-formal" style={{ marginTop: 'auto' }}>
                <span>Rekapitulasi E-Rapor Tahfidz PPTQ Jamal Yusuf Al-Haddad • Dicetak pada {new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
