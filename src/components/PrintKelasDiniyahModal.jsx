import React, { useState, useMemo, useEffect } from 'react';
import { X, Printer, BookOpen, Award, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { 
  MATA_PELAJARAN_DINIYAH, 
  hitungRaporDiniyah, 
  hitungRankingDiniyah,
  PREDIKAT_DINIYAH_LABEL_ID,
  PREDIKAT_DINIYAH_COLORS 
} from '../utils/diniyahCalc';
import { formatNamaKelas, SEMESTER_BILINGUAL } from '../utils/tahfidzCalc';
import { usePrintDocumentTitle, executePrintWithTitle } from '../utils/printTitleHelper';
import DiniyahRaporA4Sheet from './DiniyahRaporA4Sheet';

export default function PrintKelasDiniyahModal({ santriList = [], initialKelas = 'الأول', currentPeriod, onClose }) {
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
    const standard = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    standard.forEach(k => {
      if (santriList.some(s => s.kelas === k)) {
        set.add(k);
      }
    });
    santriList.forEach(s => {
      if (s.kelas) set.add(s.kelas);
    });
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

  const semLabel = SEMESTER_BILINGUAL[selectedSemester] || (selectedSemester === 'Genap' ? 'Genap (الثاني)' : 'Ganjil (الأول)');
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const defaultTahunPelajaran = `${startYear} / ${startYear + 1}`;
  const tahunPelajaran = currentPeriod?.tahun_ajaran || defaultTahunPelajaran;

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  // Santri di kelas terpilih beserta ranking Diniyah
  const santriKelas = useMemo(() => {
    const filtered = santriList.filter(s => {
      if (selectedKelas === 'Alumni' || selectedKelas === 'alumni') {
        return s.kelas === 'Alumni' || s.kelas === 'alumni' || s.status === 'alumni';
      }
      return s.kelas === selectedKelas;
    });

    return hitungRankingDiniyah(filtered);
  }, [santriList, selectedKelas]);

  // Statistik ringkas kelas
  const statsKelas = useMemo(() => {
    const total = santriKelas.length;
    if (total === 0) {
      return { total: 0, countDinilai: 0, rataRataKelas: 0, nilaiTertinggi: 0, persenTuntas: 0 };
    }

    let sumRata = 0;
    let countDinilai = 0;
    let maxRata = 0;
    let tuntasCount = 0;

    santriKelas.forEach(s => {
      const calc = hitungRaporDiniyah(s.nilaiDiniyah || {});
      if (calc.count > 0) {
        countDinilai += 1;
        const r = parseFloat(calc.rataRata) || 0;
        sumRata += r;
        if (r > maxRata) maxRata = r;
        if (r >= 60) tuntasCount += 1;
      }
    });

    return {
      total,
      countDinilai,
      rataRataKelas: countDinilai > 0 ? (sumRata / countDinilai).toFixed(2) : 0,
      nilaiTertinggi: countDinilai > 0 ? maxRata.toFixed(2) : 0,
      persenTuntas: countDinilai > 0 ? Math.round((tuntasCount / countDinilai) * 100) : 0
    };
  }, [santriKelas]);

  // Format Nama File Otomatis saat Simpan PDF
  const kelasLabel = formatNamaKelas(selectedKelas);
  const printTitle = (printMode === 'leger' || printMode === 'rekap')
    ? `${kelasLabel} - Rekap Leger Nilai Diniyah`
    : `${kelasLabel} - Semua Rapor Diniyah`;
  usePrintDocumentTitle(printTitle);

  const handlePrint = () => {
    executePrintWithTitle(printTitle);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content print-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Toolbar Aksi Header Modern & Sleek (Identik Cetak Per Kelas Tahfidz) */}
        <div className="modal-header print-modal-header print-kelas-header no-print">
          
          {/* Baris Atas: Info Judul di Kiri & Tombol X di Ujung Kanan Atas */}
          <div className="print-header-top-bar">
            <div className="print-modal-title-box">
              <div className="print-header-top-row">
                <span className="print-badge-pill admin">
                  👑 Mode Cetak Admin
                </span>
                <span className="print-student-info-chip">
                  Kelas: {formatNamaKelas(selectedKelas)} • {santriKelas.length} Santriwati
                </span>
              </div>
              <h2 className="print-modal-heading">
                CETAK PER KELAS DINIYAH — PPTQ JAMAL YUSUF
              </h2>
            </div>

            {/* Tombol X Merah Background Putih di Ujung Kanan Atas */}
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

          {/* Baris Bawah: Seluruh Kontrol Aksi & Tombol Cetak */}
          <div className="print-modal-actions print-kelas-actions">
            
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
                  <option key={k} value={k}>{formatNamaKelas(k)}</option>
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

            {/* Tombol Cetak Utama */}
            <button 
              className="btn btn-primary btn-print-main" 
              onClick={handlePrint}
            >
              <Printer size={16} /> 
              {printMode === 'batch' 
                ? `Cetak Rapor Kelas (${santriKelas.length} Lembar A4)` 
                : 'Cetak Leger Nilai Diniyah'}
            </button>
          </div>
        </div>

        {/* Paper Container A4 */}
        <div className="modal-body print-modal-body print-kelas-body">
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
                Belum ada data santriwati yang terdaftar di kelas <strong>{formatNamaKelas(selectedKelas)}</strong>.
              </div>
            ) : printMode === 'batch' ? (
              /* MODE 1: BATCH PRINT SELURUH RAPOR SANTRI A4 (1 SANTRI 1 HALAMAN A4 100% SAMA DENGAN CETAK INDIVIDU) */
              <div className="batch-rapor-container">
                {santriKelas.map((santri, idx) => (
                  <div key={santri.id} className="batch-rapor-page">
                    <DiniyahRaporA4Sheet
                      santri={santri}
                      ranking={santri.ranking}
                      totalSantri={santriKelas.length}
                      currentPeriod={currentPeriod}
                      selectedSemester={selectedSemester}
                      pageNumber={idx + 1}
                      totalPages={santriKelas.length}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* MODE 2: REKAPITULASI LEGER NILAI & PERINGKAT 1 KELAS DINIYAH (Sesuai Ranking.xlsx & Model Tahfidz) */
              <div className="rekap-kelas-a4">
                {/* Kop Pondok Resmi */}
                <div className="letterhead-wrapper">
                  <img
                    src="/kop-pondok.png"
                    alt="Pusat Tahfidzul Qur'an Jamal Al-Haddad Tulang Bawang"
                    className="letterhead-img"
                  />
                </div>

                <div className="spacer-header-top"></div>

                <div className="doc-header-formal">
                  <div className="arabic title-ar">كَشْفُ دَرَجَاتِ التَّعْلِيْمِ الدِّيْنِيِّ لِجَمِيْعِ الطَّالِبَاتِ</div>
                  <h1 className="doc-title-formal title-rapor-tahfidz">
                    Rekapitulasi Nilai & Peringkat Diniyah Kelas {formatNamaKelas(selectedKelas)}
                  </h1>
                </div>

                <div className="spacer-header-bottom"></div>

                {/* Info Kelas & Periode (2 Kolom Grid Identik Tahfidz) */}
                <table className="student-info-formal-lg" style={{ marginBottom: '10px' }}>
                  <tbody>
                    <tr>
                      <td className="info-label">Kelas / Tingkat</td>
                      <td className="info-colon">:</td>
                      <td className="info-val bold">{formatNamaKelas(selectedKelas)}</td>

                      <td className="info-label">Semester</td>
                      <td className="info-colon">:</td>
                      <td className="info-val bold">{semLabel}</td>
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

                {/* Ringkasan Statistik Kelas (4 Kolom Persis Tahfidz) */}
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
                    <div className="summary-card-label">Ketuntasan (≥60)</div>
                    <div className="summary-card-val" style={{ color: '#047857' }}>{statsKelas.persenTuntas}%</div>
                  </div>
                </div>

                {/* Tabel Leger Nilai 8 Mata Pelajaran */}
                <table className="rekap-table-formal">
                  <thead>
                    <tr>
                      <th style={{ width: '42px' }}>Rank</th>
                      <th style={{ width: '85px' }}>NIS</th>
                      <th style={{ textAlign: 'left', paddingLeft: '8px' }}>Nama Santriwati</th>
                      {MATA_PELAJARAN_DINIYAH.map(m => (
                        <th key={m.id} style={{ width: '45px', fontSize: '7.8pt' }} title={m.labelId || m.nama}>
                          <div>{(m.labelId || m.nama).slice(0, 5)}</div>
                          <div className="arabic" style={{ fontSize: '8pt', color: '#86efac' }}>
                            {m.labelAr || m.arab}
                          </div>
                        </th>
                      ))}
                      <th style={{ width: '52px' }}>Total</th>
                      <th style={{ width: '52px' }}>Rata</th>
                      <th style={{ width: '95px' }}>Predikat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {santriKelas.map((santri, idx) => {
                      const calc = hitungRaporDiniyah(santri.nilaiDiniyah || {});
                      const colorInfo = PREDIKAT_DINIYAH_COLORS[calc.predikatAkhir] || PREDIKAT_DINIYAH_COLORS['-'];

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
                          <td style={{ fontSize: '8pt', textAlign: 'center' }}>{santri.nis || santri.id}</td>
                          <td style={{ textAlign: 'left', paddingLeft: '8px', fontWeight: 600 }}>{santri.nama}</td>
                          {MATA_PELAJARAN_DINIYAH.map(m => {
                            const val = santri.nilaiDiniyah?.[m.id];
                            return (
                              <td key={m.id} style={{ textAlign: 'center', fontSize: '8.5pt', fontWeight: val ? 700 : 400 }}>
                                {val !== undefined && val !== null && val !== '' ? val : '—'}
                              </td>
                            );
                          })}
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{calc.total}</td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#15803d' }}>
                            {calc.count > 0 ? calc.rataRata : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className="predikat-pill"
                              style={{
                                background: colorInfo.bg,
                                color: colorInfo.text,
                                border: `1px solid ${colorInfo.border}`,
                                fontSize: '7.8pt',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <strong className="arabic">{calc.predikatAkhir}</strong> {PREDIKAT_DINIYAH_LABEL_ID[calc.predikatAkhir] ? `(${PREDIKAT_DINIYAH_LABEL_ID[calc.predikatAkhir]})` : ''}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Tanda Tangan Formal 3 Pihak (Format Sejajar Sempurna & Kosong) */}
                <div className="signature-container-formal signature-3col-formal" style={{ marginTop: '24px' }}>
                  
                  {/* Kolom 1: Kabag. Pendidikan & Tarbiyah */}
                  <div className="signature-col-formal">
                    <div className="sig-top-line">
                      Mengetahui, <span className="arabic">(معرفة)</span>
                    </div>
                    <div className="sig-role-line bold">
                      <span className="arabic" style={{ fontSize: '11pt', fontWeight: 'bold' }}>رئيس قسم التربية والتعليم</span>
                    </div>
                    <div className="sig-space-formal"></div>
                    <div className="sig-name-box">
                      <div className="arabic sig-name-ar" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                        ابن خيرية
                      </div>
                    </div>
                  </div>

                  {/* Kolom 2: Wali Kelas */}
                  <div className="signature-col-formal">
                    <div className="sig-top-line">
                      Mengetahui, <span className="arabic">(معرفة)</span>
                    </div>
                    <div className="sig-role-line bold">
                      Wali Kelas {formatNamaKelas(selectedKelas)}
                    </div>
                    <div className="sig-space-formal"></div>
                    <div className="sig-name-box">
                      <div className="sig-line-formal">
                        ( <span className="sig-solid-line"></span> )
                      </div>
                    </div>
                  </div>

                  {/* Kolom 3: Kepala Bagian Diniyah */}
                  <div className="signature-col-formal">
                    <div className="sig-top-line">
                      Tulang Bawang, {formattedDate}
                    </div>
                    <div className="sig-role-line bold">
                      <span className="arabic" style={{ fontSize: '11pt', fontWeight: 'bold' }}>رئيسة قسم الدينية</span>
                    </div>
                    <div className="sig-space-formal"></div>
                    <div className="sig-name-box">
                      <div className="arabic sig-name-ar" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                        نينا هرياتي
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer Dokumen Resmi */}
                <div className="doc-footer-formal" style={{ marginTop: '16px' }}>
                  <span>E-Rapor Diniyah PPTQ Jamal Yusuf Al-Haddad Tahun {currentYear} • Leger Rekap Nilai</span>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
