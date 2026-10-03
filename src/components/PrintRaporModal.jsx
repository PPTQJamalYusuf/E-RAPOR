import React, { useState, useEffect } from 'react';
import { X, Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { 
  getPredikat, 
  hitungRapor, 
  hitungRaporTahsin,
  KRITERIA_TAHSIN,
  formatNamaKelas,
  KELAS_BILINGUAL, 
  SEMESTER_BILINGUAL,
  PREDIKAT_LABEL_ID 
} from '../utils/tahfidzCalc';

export default function PrintRaporModal({ santri, ranking, onClose, currentPeriod, currentUser }) {
  const initialSem = currentPeriod?.semester === 'Genap' ? 'الثاني' : (santri.semester || 'الأول');
  const [selectedSemester, setSelectedSemester] = useState(initialSem);
  const [zoom, setZoom] = useState(1);
  const [printDocType, setPrintDocType] = useState('tahfidz'); // 'tahfidz' | 'tahsin' | 'both'
  const calc = hitungRapor(santri.nilaiJuz || {});
  const calcTahsin = hitungRaporTahsin(santri.nilaiTahsin || {});
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

  // Sub-Tabel Vertikal 15 Juz per Kolom
  const renderSplitVerticalTable = (startJuz, endJuz) => {
    const juzList = [];
    for (let j = startJuz; j <= endJuz; j++) {
      juzList.push(j);
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
          {juzList.map(j => {
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

  // Render Dokumen Rapor Tahfidz (30 Juz)
  const renderTahfidzDocument = (isPageBreak = false) => (
    <div className={`rapor-a4-formal ${isPageBreak ? 'page-break-print' : ''}`}>
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

      {/* 4. TABEL 2 KOLOM VERTIKAL: JUZ 1-15 & JUZ 16-30 */}
      <div className="section-title-formal">
        <span>A. Capaian Hafalan Al-Qur'an 30 Juz</span>
      </div>

      <div className="tabel-split-vertical-wrapper">
        <div className="tabel-split-col">
          {renderSplitVerticalTable(1, 15)}
        </div>
        <div className="tabel-split-col">
          {renderSplitVerticalTable(16, 30)}
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

      {/* SPASI 4: Form ttd */}
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

      {/* 9. FOOTER */}
      <div className="doc-footer-formal">
        <span>E-Rapor Tahfidz PPTQ Jamal Yusuf Al-Haddad Tahun {new Date().getFullYear()}</span>
      </div>
    </div>
  );

  // Render Dokumen Rapor Tahsin (7 Kriteria Tajwid Sesuai Excel Ust. Hanifah)
  const renderTahsinDocument = (isPageBreak = false) => (
    <div className={`rapor-a4-formal ${isPageBreak ? 'page-break-print' : ''}`}>
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

      {/* 2. JUDUL DOKUMEN: TAHSIN */}
      <div className="doc-header-formal">
        <div className="arabic title-ar">كَشْفُ دَرَجَاتِ تَحْسِيْنِ الْقُرْآنِ الْكَرِيْمِ</div>
        <h1 className="doc-title-formal title-rapor-tahfidz">Rapor Tahsin Al-Qur'an</h1>
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

      {/* 4. TABEL 7 KRITERIA TAHSIN RESMI */}
      <div className="section-title-formal">
        <span>A. Capaian Pembelajaran Tahsin & Tajwid Al-Qur'an</span>
      </div>

      <table className="tahsin-formal-table">
        <thead>
          <tr>
            <th style={{ width: '45px', textAlign: 'center' }}>
              <span>No</span>
              <span className="arabic" style={{ fontSize: '10pt', marginLeft: '4px' }}>الرقم</span>
            </th>
            <th style={{ textAlign: 'left', paddingLeft: '14px' }}>
              <span>Aspek Penilaian</span>
              <span className="arabic" style={{ fontSize: '10pt', marginLeft: '6px' }}>معايير التقييم</span>
            </th>
            <th style={{ width: '135px', textAlign: 'center' }}>
              <span>Nilai</span>
              <span className="arabic" style={{ fontSize: '10pt', marginLeft: '4px' }}>الدرجة</span>
            </th>
            <th style={{ width: '185px', textAlign: 'center' }}>
              <span>Predikat</span>
              <span className="arabic" style={{ fontSize: '10pt', marginLeft: '4px' }}>التقدير</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {KRITERIA_TAHSIN.map((k, idx) => {
            const item = calcTahsin.details[k.id];
            const hasVal = item !== undefined;
            const val = hasVal ? item.nilai : '—';
            const pred = hasVal ? item.predikat : '';
            return (
              <tr key={k.id}>
                <td className="cell-num">{idx + 1}</td>
                <td className="cell-aspek">
                  <span className="aspek-id bold">{k.labelId}</span>
                  <span className="aspek-ar arabic" style={{ fontSize: '10.5pt', marginLeft: '8px', color: '#166534', fontWeight: 600 }}>
                    {k.labelAr}
                  </span>
                </td>
                <td className={`cell-tahsin-val ${hasVal ? 'has-val' : 'is-empty'}`}>
                  {val}
                </td>
                <td className={`cell-tahsin-pred ${hasVal ? '' : 'is-empty'}`}>
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

      {/* 5. RINGKASAN HASIL BELAJAR TAHSIN */}
      <div className="section-title-formal" style={{ marginTop: '6px' }}>
        <span>B. Ringkasan Hasil Belajar Tahsin</span>
      </div>

      <div className="summary-cards-4col" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="summary-card-item">
          <div className="summary-card-label">
            <span>Total Nilai (المجموع)</span>
          </div>
          <div className="summary-card-val">{calcTahsin.total}</div>
        </div>

        <div className="summary-card-item">
          <div className="summary-card-label">
            <span>Nilai Rata-rata (الدرجة)</span>
          </div>
          <div className="summary-card-val highlight-green">
            {calcTahsin.count > 0 ? calcTahsin.rataRata : '—'}
          </div>
        </div>

        <div className="summary-card-item">
          <div className="summary-card-label">
            <span>Predikat Akhir (التقدير)</span>
          </div>
          <div className="summary-card-val" style={{ color: '#047857', fontSize: '11pt', fontWeight: 800 }}>
            {calcTahsin.count > 0 ? (
              <span>
                <span className="arabic" style={{ fontSize: '12pt', fontWeight: 'bold' }}>
                  {calcTahsin.predikatAkhir}
                </span>
                {' '}
                <span style={{ fontSize: '8.5pt', fontWeight: 600, color: '#047857', fontFamily: 'Calibri, sans-serif' }}>
                  ({PREDIKAT_LABEL_ID[calcTahsin.predikatAkhir] || calcTahsin.predikatAkhir})
                </span>
              </span>
            ) : '—'}
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

      {/* 7. CATATAN PEMBINA TAHSIN */}
      <div className="catatan-box-formal">
        <div className="catatan-title-formal">
          <span>C. Catatan Perkembangan Tahsin</span>
        </div>
        <div className="catatan-content-formal" style={{ fontSize: '10pt', lineHeight: 1.5, minHeight: '22px' }}>
          {santri.catatan || ''}
        </div>
        <div className="catatan-dotted-line"></div>
      </div>

      {/* SPASI: Form ttd */}
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
            Pembina Tahsin & Tahfidz <span className="arabic">(رئيس قسم التحسين والتحفيظ)</span>
          </div>
          <div className="sig-space-formal"></div>
          <div className="sig-name-box">
            <div className="arabic sig-name-ar">يينى رحمواتـى</div>
            <div className="sig-name-latin">YENI RAHMAWATI</div>
          </div>
        </div>
      </div>

      {/* 9. FOOTER */}
      <div className="doc-footer-formal">
        <span>E-Rapor Tahsin PPTQ Jamal Yusuf Al-Haddad Tahun {new Date().getFullYear()}</span>
      </div>
    </div>
  );

  const getModalHeading = () => {
    if (!isAdmin) {
      if (printDocType === 'tahsin') return 'PRATINJAU RAPOR TAHSIN (HANYA LIHAT)';
      if (printDocType === 'both') return 'PRATINJAU RAPOR TAHFIDZ & TAHSIN (HANYA LIHAT)';
      return 'PRATINJAU RAPOR TAHFIDZ (HANYA LIHAT)';
    }
    if (printDocType === 'tahsin') return 'RAPOR TAHSIN AL-QUR\'AN (A4 Formal Bersama Kop)';
    if (printDocType === 'both') return 'RAPOR TAHFIDZ & TAHSIN (2 Halaman A4 Formal)';
    return 'RAPOR TAHFIDZ (A4 Formal Bersama Kop)';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content print-modal-container ${!isAdmin ? 'guru-view-only-lock' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Toolbar Aksi Header Modern & Sleek */}
        <div className="modal-header print-modal-header no-print">
          <div className="print-modal-title-box">
            <div className="print-header-top-row">
              <span className={`print-badge-pill ${isAdmin ? 'admin' : 'guru'}`}>
                {isAdmin ? '👑 Mode Cetak Admin' : '👁️ Pratinjau Guru (Hanya Lihat)'}
              </span>
              <span className="print-student-info-chip">
                {santri.nama} • {formatNamaKelas(santri.kelas)} {santri.is_tahsin && '• [Tahsin]'} {ranking !== '-' && `• Peringkat #${ranking}`}
              </span>
            </div>
            <h2 className="print-modal-heading">
              {getModalHeading()}
            </h2>
          </div>

          <div className="print-modal-right-section">
            <div className="print-modal-actions">
              {/* Selector Lembar Rapor Khusus Santri Tahsin */}
              {santri.is_tahsin && (
                <div className="print-doc-type-selector">
                  <button
                    type="button"
                    className={`btn-doc-pill ${printDocType === 'tahfidz' ? 'active' : ''}`}
                    onClick={() => setPrintDocType('tahfidz')}
                    title="Cetak lembar Rapor Tahfidz (Hafalan 30 Juz)"
                  >
                    📖 Tahfidz
                  </button>
                  <button
                    type="button"
                    className={`btn-doc-pill ${printDocType === 'tahsin' ? 'active' : ''}`}
                    onClick={() => setPrintDocType('tahsin')}
                    title="Cetak lembar Rapor Tahsin (7 Kriteria Tajwid)"
                  >
                    🗣️ Tahsin
                  </button>
                  <button
                    type="button"
                    className={`btn-doc-pill ${printDocType === 'both' ? 'active' : ''}`}
                    onClick={() => setPrintDocType('both')}
                    title="Cetak kedua dokumen (Tahfidz & Tahsin) dalam 2 lembar A4"
                  >
                    🖨️ Keduanya
                  </button>
                </div>
              )}

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
            {santri.is_tahsin ? (
              <>
                {printDocType === 'tahfidz' && renderTahfidzDocument(false)}
                {printDocType === 'tahsin' && renderTahsinDocument(false)}
                {printDocType === 'both' && (
                  <>
                    {renderTahfidzDocument(true)}
                    {renderTahsinDocument(false)}
                  </>
                )}
              </>
            ) : (
              renderTahfidzDocument(false)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
