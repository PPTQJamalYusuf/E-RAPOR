import React from 'react';
import { MATA_PELAJARAN_DINIYAH, getPredikatDiniyah, hitungRaporDiniyah, PREDIKAT_DINIYAH_LABEL_ID } from '../utils/diniyahCalc';
import { formatNamaKelas, SEMESTER_BILINGUAL } from '../utils/tahfidzCalc';

/**
 * Komponen Tunggal Lembar Rapor Diniyah A4 Formal
 * Digunakan bersama oleh:
 * 1. PrintDiniyahModal (Cetak 1 Santriwati)
 * 2. PrintKelasDiniyahModal (Cetak Batch Rapor Santriwati 1 Kelas)
 * Menjamin 100% konsistensi tampilan dan presisi ukuran cetak A4.
 */
export default function DiniyahRaporA4Sheet({
  santri,
  ranking,
  totalSantri,
  currentPeriod,
  selectedSemester,
  pageNumber,
  totalPages
}) {
  const calc = hitungRaporDiniyah(santri.nilaiDiniyah || {});
  
  // Tahun Pelajaran dinamis
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const defaultTahunPelajaran = `${startYear} / ${startYear + 1}`;
  const tahunPelajaran = currentPeriod?.tahun_ajaran || santri.tahunPelajaran || santri.tahun_pelajaran || defaultTahunPelajaran;

  const semVal = selectedSemester || (currentPeriod?.semester === 'Genap' ? 'الثاني' : 'الأول');
  const semLabel = SEMESTER_BILINGUAL[semVal] || semVal || 'Ganjil (الأول)';

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  const hasRank = ranking !== '-' && ranking !== undefined && ranking !== null;

  return (
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

      {/* 2. JUDUL DOKUMEN: RAPOR DINIYAH */}
      <div className="doc-header-formal">
        <div className="arabic title-ar">كَشْفُ دَرَجَاتِ التَّعْلِيْمِ الدِّيْنِيِّ</div>
        <h1 className="doc-title-formal title-rapor-tahfidz">Rapor Diniyah</h1>
      </div>

      {/* SPASI 2 */}
      <div className="spacer-header-bottom"></div>

      {/* 3. DATA SANTRI (Tabel 2 Kolom Formal Grid Identik Tahfidz) */}
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
              {formatNamaKelas(santri.kelas)}
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
              {semLabel}
            </td>
          </tr>
          <tr>
            <td className="info-label">
              Tahun Pelajaran <span className="ar-label-inline">العام</span>
            </td>
            <td className="info-colon">:</td>
            <td className="info-val">{tahunPelajaran}</td>

            <td className="info-label">
              Peringkat <span className="ar-label-inline">المرتبة</span>
            </td>
            <td className="info-colon">:</td>
            <td className="info-val bold">
              {hasRank ? (totalSantri ? `#${ranking} dari ${totalSantri} santri` : `#${ranking}`) : '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 4. TABEL CAPAIAN PEMBELAJARAN DINIYAH (8 MATA PELAJARAN) */}
      <div className="section-title-formal">
        <span>A. Capaian Hasil Belajar Mata Pelajaran Diniyah</span>
      </div>

      <table className="tahsin-formal-table" style={{ width: '100%', marginBottom: '6px' }}>
        <thead>
          <tr>
            <th style={{ width: '38px', textAlign: 'center' }}>
              <span>No</span>
              <span className="arabic" style={{ fontSize: '9.5pt', marginLeft: '3px' }}>الرقم</span>
            </th>
            <th style={{ textAlign: 'left', paddingLeft: '14px' }}>
              <span>Mata Pelajaran</span>
              <span className="arabic" style={{ fontSize: '9.5pt', marginLeft: '6px' }}>المادة الدراسية</span>
            </th>
            <th style={{ width: '65px', textAlign: 'center' }}>
              <span>KKM</span>
              <span className="arabic" style={{ fontSize: '9.5pt', marginLeft: '3px' }}>المعيار</span>
            </th>
            <th style={{ width: '75px', textAlign: 'center' }}>
              <span>Nilai</span>
              <span className="arabic" style={{ fontSize: '9.5pt', marginLeft: '3px' }}>الدرجة</span>
            </th>
            <th style={{ width: '160px', textAlign: 'center' }}>
              <span>Predikat</span>
              <span className="arabic" style={{ fontSize: '9.5pt', marginLeft: '3px' }}>التقدير</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {MATA_PELAJARAN_DINIYAH.map((m, idx) => {
            const rawVal = santri.nilaiDiniyah?.[m.id];
            const hasVal = rawVal !== undefined && rawVal !== null && rawVal !== '';
            const numVal = hasVal ? Number(rawVal) : null;
            const pred = hasVal ? getPredikatDiniyah(numVal) : '';

            return (
              <tr key={m.id}>
                <td className="cell-num">{idx + 1}</td>
                <td className="cell-aspek">
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {m.labelId || m.nama}
                  </span>
                  <span className="arabic" style={{ fontSize: '10.5pt', marginLeft: '8px', color: '#166534', fontWeight: 700 }}>
                    {m.labelAr || m.arab}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '9pt' }}>
                  60
                </td>
                <td className={`cell-tahsin-val ${hasVal ? 'has-val' : 'is-empty'}`} style={{ textAlign: 'center' }}>
                  {hasVal ? numVal : '—'}
                </td>
                <td className={`cell-tahsin-pred ${hasVal ? '' : 'is-empty'}`} style={{ textAlign: 'center' }}>
                  {hasVal ? (
                    <span>
                      <span className="arabic" style={{ fontSize: '10pt', fontWeight: 'bold' }}>
                        {pred}
                      </span>
                      {' '}
                      <span style={{ fontSize: '7.5pt', fontFamily: 'Calibri, sans-serif', fontWeight: 600, color: '#166534' }}>
                        ({PREDIKAT_DINIYAH_LABEL_ID[pred] || pred})
                      </span>
                    </span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 5. RINGKASAN HASIL BELAJAR & PERINGKAT (4 Kolom Persis Tahfidz) */}
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
                  ({PREDIKAT_DINIYAH_LABEL_ID[calc.predikatAkhir] || calc.predikatAkhir})
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
            {hasRank ? `#${ranking}` : '—'}
          </div>
        </div>
      </div>

      {/* 6. LEGENDA KRITERIA KELULUSAN (Format Asli Horizontal) */}
      <div className="legenda-kriteria-horizontal">
        <div className="legenda-title">
          <span>Kriteria Kelulusan <span className="arabic">(معيار التقدير)</span>:</span>
        </div>
        <div className="legenda-items">
          <span className="legenda-chip">90–100: <strong className="arabic">ممتاز</strong> (Sangat Baik)</span>
          <span className="legenda-chip">80–89: <strong className="arabic">جيّد جدا</strong> (Baik Sekali)</span>
          <span className="legenda-chip">70–79: <strong className="arabic">جيّد</strong> (Baik)</span>
          <span className="legenda-chip">60–69: <strong className="arabic">مقبول</strong> (Cukup)</span>
          <span className="legenda-chip">&lt;60: <strong className="arabic">راسب</strong> (Mengulang)</span>
        </div>
      </div>

      {/* 7. CATATAN */}
      <div className="catatan-box-formal">
        <div className="catatan-title-formal">
          <span>C. Catatan</span>
        </div>
        <div className="catatan-content-formal" style={{ fontSize: '10pt', lineHeight: 1.5, minHeight: '22px' }}>
          {santri.catatanDiniyah || santri.catatan || ''}
        </div>
        <div className="catatan-dotted-line"></div>
      </div>

      {/* SPASI 4: Form ttd */}
      <div className="spacer-3"></div>

      {/* 8. TANDA TANGAN RESMI 3 PIHAK (Format Sejajar Sempurna & Kosong Sesuai Permintaan) */}
      <div className="signature-container-formal signature-3col-formal">
        
        {/* Kolom 1: Kabag. Pendidikan & Tarbiyah */}
        <div className="signature-col-formal">
          <div className="sig-top-line">
            Mengetahui, <span className="arabic">(معرفة)</span>
          </div>
          <div className="sig-role-line bold">
            Kabag. Pendidikan &amp; Tarbiyah
          </div>
          <div className="sig-space-formal"></div>
          <div className="sig-name-box">
            <div className="sig-line-formal">
              ( <span className="sig-solid-line"></span> )
            </div>
          </div>
        </div>

        {/* Kolom 2: Orang Tua / Wali Santriwati */}
        <div className="signature-col-formal">
          <div className="sig-top-line">
            Mengetahui, <span className="arabic">(معرفة)</span>
          </div>
          <div className="sig-role-line bold">
            Orang Tua / Wali Santri <span className="arabic">(ولي الطالبة)</span>
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
            Kepala Bagian Diniyah <span className="arabic">(رئيسة قسم الدينية)</span>
          </div>
          <div className="sig-space-formal"></div>
          <div className="sig-name-box">
            <div className="sig-line-formal">
              ( <span className="sig-solid-line"></span> )
            </div>
          </div>
        </div>

      </div>

      {/* 9. FOOTER DOKUMEN RESMI */}
      <div className="doc-footer-formal">
        <span>
          E-Rapor Diniyah PPTQ Jamal Yusuf Al-Haddad Tahun {currentYear}
          {pageNumber && totalPages ? ` • Hal. ${pageNumber} dari ${totalPages}` : ''}
        </span>
      </div>
    </div>
  );
}
