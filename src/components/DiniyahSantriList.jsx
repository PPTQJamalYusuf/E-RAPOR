import React, { useState, useMemo } from 'react';
import { Search, Edit3, Printer, BookOpen, CheckCircle, Clock, Eye, Sparkles } from 'lucide-react';
import { MATA_PELAJARAN_DINIYAH, hitungRaporDiniyah, hitungRankingDiniyah, PREDIKAT_DINIYAH_COLORS } from '../utils/diniyahCalc';
import { formatNamaKelas } from '../utils/tahfidzCalc';

export default function DiniyahSantriList({
  santriList,
  onOpenInputMapel,
  onSelectInputSiswa,
  onSelectPrintDiniyah,
  onSelectPrintClassDiniyah,
  currentUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState(() => {
    if (currentUser?.role === 'guru_diniyah' && currentUser?.kelas_binaan && currentUser?.kelas_binaan !== 'Semua') {
      return currentUser.kelas_binaan;
    }
    return 'Semua';
  });

  // Daftar kelas
  const kelasList = useMemo(() => {
    const list = ['Semua', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    const hasAlumni = santriList.some(s => s.kelas === 'Alumni' || s.kelas === 'alumni' || s.status === 'alumni');
    if (hasAlumni) list.push('Alumni');
    return list;
  }, [santriList]);

  // Hitung ranking Diniyah per kelas
  const rankedSantriList = useMemo(() => {
    const grouped = {};
    santriList.forEach(s => {
      const k = s.kelas || 'Lainnya';
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(s);
    });

    const result = [];
    Object.keys(grouped).forEach(k => {
      const ranked = hitungRankingDiniyah(grouped[k]);
      result.push(...ranked);
    });

    return result;
  }, [santriList]);

  // Filter pencarian & kelas
  const filteredSantri = useMemo(() => {
    return rankedSantriList.filter(s => {
      let matchesKelas = false;
      if (selectedKelas === 'Semua') {
        matchesKelas = true;
      } else if (selectedKelas === 'Alumni' || selectedKelas === 'alumni') {
        matchesKelas = s.kelas === 'Alumni' || s.kelas === 'alumni' || s.status === 'alumni';
      } else {
        matchesKelas = s.kelas === selectedKelas;
      }

      const searchStr = (s.nis || s.id || '').toString().toLowerCase();
      const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            searchStr.includes(searchTerm.toLowerCase());
      return matchesKelas && matchesSearch;
    });
  }, [rankedSantriList, selectedKelas, searchTerm]);

  // Statistik ringkas Diniyah
  const totalSantri = santriList.length;
  const tuntasSemuaMapel = santriList.filter(s => {
    const calc = hitungRaporDiniyah(s.nilaiDiniyah || {});
    return calc.count === MATA_PELAJARAN_DINIYAH.length;
  }).length;
  const belumLengkap = totalSantri - tuntasSemuaMapel;

  return (
    <div>
      {/* 3 Kartu Statistik Ringkas Diniyah */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-val">{totalSantri}</div>
            <div className="stat-lbl">Total Santriwati (Diniyah)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{tuntasSemuaMapel}</div>
            <div className="stat-lbl">Lengkap 8 Mata Pelajaran</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{belumLengkap}</div>
            <div className="stat-lbl">Belum Lengkap / Proses Input</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Input Cepat Per Mapel & Filter */}
      <div className="toolbar-card" style={{ borderLeft: '4px solid #4f46e5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={18} color="#4f46e5" /> Lembar Kerja E-Rapor Diniyah
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Pilih kelas dan mata pelajaran untuk mulai mengisi nilai massal per kelas dengan cepat.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onOpenInputMapel && onOpenInputMapel(selectedKelas !== 'Semua' ? selectedKelas : 'الأول')}
            style={{ 
              background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', 
              color: '#ffffff', 
              fontWeight: 700, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '0.55rem 1.15rem',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Edit3 size={15} /> ⚡ Input Cepat Per Mapel (Ala Excel)
          </button>
        </div>

        <div className="search-and-tools" style={{ marginTop: '0.5rem' }}>
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Cari nama santriwati atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            Menampilkan: <strong style={{ color: 'var(--slate-800)' }}>{filteredSantri.length}</strong> santriwati
          </div>
        </div>

        {/* Filter Tombol Kelas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
          <div className="class-filters">
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-500)', marginRight: '0.5rem' }}>
              Pilih Kelas:
            </span>
            {kelasList.map(k => (
              <button
                key={k}
                className={`filter-btn ${selectedKelas === k ? 'active' : ''}`}
                onClick={() => setSelectedKelas(k)}
              >
                {formatNamaKelas(k)}
              </button>
            ))}
          </div>

          {currentUser?.role === 'admin' && (
            <button
              className="btn btn-gold btn-print-class"
              onClick={() => onSelectPrintClassDiniyah && onSelectPrintClassDiniyah(selectedKelas !== 'Semua' ? selectedKelas : 'الأول')}
              title="Cetak seluruh lembar rapor Diniyah A4 atau rekap per kelas"
              style={{ padding: '0.45rem 0.95rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Cetak Diniyah {selectedKelas !== 'Semua' ? `(${formatNamaKelas(selectedKelas)})` : ''}
            </button>
          )}
        </div>
      </div>

      {/* Tabel Santriwati Diniyah (Tampilan Desktop) */}
      <div className="table-container">
        <table className="santri-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>No</th>
              <th style={{ width: '90px' }}>NIS</th>
              <th>Nama Santriwati</th>
              <th style={{ width: '100px' }}>Kelas</th>
              <th style={{ width: '110px' }}>Mapel Terisi</th>
              <th style={{ width: '90px' }}>Rata-rata</th>
              <th style={{ width: '120px' }}>Predikat</th>
              <th style={{ width: '80px' }}>Ranking</th>
              <th style={{ width: '190px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredSantri.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-400)' }}>
                  Tidak ada santriwati yang sesuai dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredSantri.map((santri, idx) => {
                const calc = hitungRaporDiniyah(santri.nilaiDiniyah || {});
                const colorInfo = PREDIKAT_DINIYAH_COLORS[calc.predikatAkhir] || PREDIKAT_DINIYAH_COLORS['-'];

                return (
                  <tr key={santri.id}>
                    <td style={{ color: 'var(--slate-400)', fontWeight: 600 }}>{idx + 1}</td>
                    <td className="santri-nis">{santri.nis || santri.id}</td>
                    <td style={{ fontWeight: 600 }}>{santri.nama}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {formatNamaKelas(santri.kelas)}
                      </span>
                    </td>
                    <td>
                      {calc.count > 0 ? (
                        <span style={{ fontWeight: 600, color: calc.count === 8 ? '#047857' : '#d97706' }}>
                          ✓ {calc.count} / 8 Mapel
                        </span>
                      ) : (
                        <span style={{ color: 'var(--slate-400)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: calc.count > 0 ? '#15803d' : '#94a3b8' }}>
                      {calc.count > 0 ? calc.rataRata : '—'}
                    </td>
                    <td>
                      <span
                        className="predikat-pill arabic"
                        style={{
                          background: colorInfo.bg,
                          color: colorInfo.text,
                          border: `1px solid ${colorInfo.border}`
                        }}
                      >
                        {calc.predikatAkhir}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#b45309' }}>
                      {santri.rankingDiniyah !== '-' ? `#${santri.rankingDiniyah}` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectInputSiswa(santri)}
                          title="Input atau ubah 8 mapel santri ini"
                        >
                          <Edit3 size={13} /> Edit 8 Mapel
                        </button>
                        {currentUser?.role === 'admin' ? (
                          <button
                            className="btn btn-gold btn-sm"
                            onClick={() => onSelectPrintDiniyah && onSelectPrintDiniyah(santri, santri.rankingDiniyah)}
                            title="Pratinjau & Cetak E-Rapor Diniyah A4"
                          >
                            <Printer size={13} /> Cetak
                          </button>
                        ) : (
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => onSelectPrintDiniyah && onSelectPrintDiniyah(santri, santri.rankingDiniyah)}
                            title="Pratinjau Lembar Rapor Diniyah"
                          >
                            <Eye size={13} /> Pratinjau
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Mobile Card View untuk HP */}
      <div className="santri-mobile-cards">
        {filteredSantri.map((santri, idx) => {
          const calc = hitungRaporDiniyah(santri.nilaiDiniyah || {});
          const colorInfo = PREDIKAT_DINIYAH_COLORS[calc.predikatAkhir] || PREDIKAT_DINIYAH_COLORS['-'];

          return (
            <div key={santri.id} className="santri-mobile-card">
              <div className="mobile-card-header">
                <div className="mobile-card-identity">
                  <div className="mobile-card-rank">
                    {santri.rankingDiniyah !== '-' ? `#${santri.rankingDiniyah}` : `#${idx + 1}`}
                  </div>
                  <div>
                    <div className="mobile-card-name">{santri.nama}</div>
                    <div className="mobile-card-meta">
                      NIS: <strong>{santri.nis || santri.id}</strong> • <strong>{formatNamaKelas(santri.kelas)}</strong>
                    </div>
                  </div>
                </div>
                <span
                  className="predikat-pill arabic"
                  style={{
                    background: colorInfo.bg,
                    color: colorInfo.text,
                    border: `1px solid ${colorInfo.border}`
                  }}
                >
                  {calc.predikatAkhir}
                </span>
              </div>

              <div className="mobile-card-stats-grid">
                <div className="mobile-stat-col">
                  <div className="mobile-stat-label">Mapel Terisi</div>
                  <div className="mobile-stat-value">{calc.count} / 8</div>
                </div>
                <div className="mobile-stat-col">
                  <div className="mobile-stat-label">Rata-rata</div>
                  <div className="mobile-stat-value" style={{ color: calc.count > 0 ? '#15803d' : '#94a3b8' }}>
                    {calc.count > 0 ? calc.rataRata : '—'}
                  </div>
                </div>
                <div className="mobile-stat-col">
                  <div className="mobile-stat-label">Ranking</div>
                  <div className="mobile-stat-value" style={{ color: '#b45309' }}>
                    {santri.rankingDiniyah !== '-' ? `#${santri.rankingDiniyah}` : '—'}
                  </div>
                </div>
              </div>

              <div className="mobile-card-actions">
                <button
                  className="btn btn-secondary btn-mobile-action"
                  onClick={() => onSelectInputSiswa(santri)}
                >
                  <Edit3 size={15} /> Edit Nilai
                </button>
                <button
                  className="btn btn-gold btn-mobile-action"
                  onClick={() => onSelectPrintDiniyah && onSelectPrintDiniyah(santri, santri.rankingDiniyah)}
                >
                  <Printer size={15} /> Cetak Rapor
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
