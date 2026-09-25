import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { 
  getPredikat, 
  hitungRapor, 
  KELAS_BILINGUAL, 
  SEMESTER_BILINGUAL,
  PREDIKAT_LABEL_ID 
} from '../utils/tahfidzCalc';

export default function PrintRaporModal({ santri, ranking, onClose }) {
  const [selectedSemester, setSelectedSemester] = useState(santri.semester || 'الأول');
  const calc = hitungRapor(santri.nilaiJuz || {});

  // Hitung Tahun Pelajaran dinamis berdasarkan kalender akademik (Juli s/d Juni)
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 = Jan, 6 = Jul
  const currentYear = now.getFullYear();
  const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const defaultTahunPelajaran = `${startYear} / ${startYear + 1}`;
  const tahunPelajaran = santri.tahunPelajaran || santri.tahun_pelajaran || defaultTahunPelajaran;

  const handlePrint = () => {
    window.print();
  };

  const toArabicNum = (n) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return n.toString().split('').map(d => arabicDigits[d] || d).join('');
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
                  <span>Juz {j}</span>
                  <span className="ar-juz-tag">{toArabicNum(j)}</span>
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
        {/* Toolbar Aksi (Disembunyikan saat dicetak) */}
        <div className="modal-header no-print">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              RAPOR TAHFIDZ (A4 Formal Bersama Kop)
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
              Format resmi dwibahasa 2 Kolom Vertikal (Juz 1–30 presisi 1 lembar A4).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#f8fafc',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid var(--slate-300)'
            }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Semester:
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#166534',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="الأول">Ganjil 1 (الأول)</option>
                <option value="الثاني">Genap 2 (الثاني)</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Cetak Dokumen (A4)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Dokumen Rapor Siap Cetak A4 */}
        <div className="modal-body print-modal-body">
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
            <div className="spacer-2"></div>

            {/* 2. JUDUL DOKUMEN: ARAB DI ATAS, INDO "RAPOR TAHFIDZ" DI BAWAH */}
            <div className="doc-header-formal">
              <div className="arabic title-ar">كشف درجات تحفيظ القرآن الكريم</div>
              <h1 className="doc-title-formal title-rapor-tahfidz">Rapor Tahfidz</h1>
            </div>

            {/* SPASI 2: Setelah judul */}
            <div className="spacer-2"></div>

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
                  <td className="info-val">{santri.id}</td>

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
                    {calc.count > 0 ? `${calc.count} Juz (${calc.count} أجزاء)` : 'Belum Diuji (—)'}
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

            {/* 5. RINGKASAN NILAI 4-KOLOM LAPANG */}
            <div className="section-title-formal" style={{ marginTop: '2px' }}>
              <span>B. Ringkasan Hasil Belajar & Peringkat</span>
              <span className="arabic" style={{ fontSize: '10.5pt', fontWeight: 'bold' }}>ب. خلاصة الدرجات والترتيب</span>
            </div>

            <div className="summary-cards-4col">
              <div className="summary-card-item">
                <div className="summary-card-label">
                  <span>Total Nilai</span>
                  <span className="arabic">المجموع الإجمالي</span>
                </div>
                <div className="summary-card-val">{calc.total}</div>
              </div>

              <div className="summary-card-item">
                <div className="summary-card-label">
                  <span>Nilai Rata-rata</span>
                  <span className="arabic">التقدير رقما</span>
                </div>
                <div className="summary-card-val highlight-green">
                  {calc.count > 0 ? calc.rataRata : '—'}
                </div>
              </div>

              <div className="summary-card-item">
                <div className="summary-card-label">
                  <span>Predikat Akhir</span>
                  <span className="arabic">التقدير لفظا</span>
                </div>
                <div className="summary-card-val" style={{ color: '#047857', fontSize: '12pt' }}>
                  <span className="arabic">
                    {calc.count > 0 ? (PREDIKAT_LABEL_ID[calc.predikatAkhir] ? `${calc.predikatAkhir} (${PREDIKAT_LABEL_ID[calc.predikatAkhir]})` : calc.predikatAkhir) : '—'}
                  </span>
                </div>
              </div>

              <div className="summary-card-item">
                <div className="summary-card-label">
                  <span>Peringkat Kelas</span>
                  <span className="arabic">الترتيب في الفصل</span>
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

            {/* 7. CATATAN PEMBINA (Diambil dari data santri saat input nilai) */}
            <div className="catatan-box-formal">
              <div className="catatan-title-formal">
                <span>C. Catatan Pembina / Penanggung Jawab</span>
                <span className="arabic">ج. ملاحظات المشرف</span>
              </div>
              <div className="catatan-content-formal" style={{ fontSize: '10pt', lineHeight: 1.5 }}>
                {santri.catatan || "Alhamdulillah telah menyelesaikan evaluasi hafalan dengan tertib dan lancar. Pertahankan dan tingkatkan mutaba'ah ziyadah serta muroja'ah harian."}
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
                <div className="sig-line-formal">
                  ( <span className="sig-solid-line"></span> )
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
                <div className="sig-name-formal bold">
                  <span className="arabic" style={{ fontSize: '12pt' }}>يينى رحمواتـى</span>
                  <div style={{ fontSize: '10pt', marginTop: '2px' }}>YENI RAHMAWATI</div>
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
  );
}
