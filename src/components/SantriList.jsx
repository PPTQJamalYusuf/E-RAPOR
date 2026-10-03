import React, { useState, useMemo } from 'react';
import { Search, Edit3, Printer, Users, Award, BookCheck, Eye } from 'lucide-react';
import { hitungRapor, hitungRanking, PREDIKAT_COLORS, formatNamaKelas } from '../utils/tahfidzCalc';

export default function SantriList({ santriList, onSelectInput, onSelectPrint, onSelectPrintClass, currentUser, onToggleTahsin }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState(() => {
    if (currentUser?.role === 'guru' && currentUser?.kelas_binaan && currentUser?.kelas_binaan !== 'Semua') {
      return currentUser.kelas_binaan;
    }
    return 'Semua';
  });

  // Daftar kelas menu: Semua, Kelas 1 s/d 6, serta Alumni jika ada
  const kelasList = useMemo(() => {
    const list = ['Semua', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    const hasAlumni = santriList.some(s => s.kelas === 'Alumni' || s.kelas === 'alumni' || s.status === 'alumni');
    if (hasAlumni) list.push('Alumni');
    return list;
  }, [santriList]);

  // Hitung ranking per kelas
  const rankedSantriList = useMemo(() => {
    // Kelompokkan per kelas lalu hitung ranking
    const grouped = {};
    santriList.forEach(s => {
      const k = s.kelas || 'Lainnya';
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(s);
    });

    const result = [];
    Object.keys(grouped).forEach(k => {
      const rankedInClass = hitungRanking(grouped[k]);
      result.push(...rankedInClass);
    });

    return result;
  }, [santriList]);

  // Filter santri berdasarkan kelas & search query
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

  // Statistik ringkas
  const totalSantri = santriList.length;
  const sudahDinilai = santriList.filter(s => {
    const calc = hitungRapor(s.nilaiJuz || {});
    return calc.count > 0;
  }).length;
  const belumDinilai = totalSantri - sudahDinilai;

  return (
    <div>
      {/* 3 Kartu Statistik Ringkas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{totalSantri}</div>
            <div className="stat-lbl">Total Santriwati (Master Excel)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <BookCheck size={24} />
          </div>
          <div>
            <div className="stat-val">{sudahDinilai}</div>
            <div className="stat-lbl">Sudah Ada Nilai Tahfidz</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{belumDinilai}</div>
            <div className="stat-lbl">Belum Memiliki Nilai</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filter Kelas */}
      <div className="toolbar-card">
        <div className="search-and-tools">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Cari nama santriwati atau NIS (contoh: Aina, Aulia)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            Menampilkan: <strong style={{ color: 'var(--slate-800)' }}>{filteredSantri.length}</strong> santri
          </div>
        </div>

        {/* Filter Tombol Kelas & Tombol Cetak Per Kelas untuk Admin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
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
              onClick={() => onSelectPrintClass && onSelectPrintClass(selectedKelas !== 'Semua' ? selectedKelas : 'الأول')}
              title="Cetak seluruh lembar rapor A4 santriwati atau rekap nilai per kelas"
              style={{ padding: '0.45rem 0.95rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Cetak Per Kelas {selectedKelas !== 'Semua' ? `(${formatNamaKelas(selectedKelas)})` : ''}
            </button>
          )}
        </div>
      </div>

      {/* 1. Tampilan Desktop: Tabel Santri */}
      <div className="table-container">
        <table className="santri-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>No</th>
              <th style={{ width: '90px' }}>NIS</th>
              <th>Nama Santriwati</th>
              <th style={{ width: '100px' }}>Kelas</th>
              <th style={{ width: '110px' }}>Jumlah Juz</th>
              <th style={{ width: '90px' }}>Rata-rata</th>
              <th style={{ width: '120px' }}>Predikat</th>
              <th style={{ width: '80px' }}>Ranking</th>
              <th style={{ width: '180px', textAlign: 'center' }}>Aksi</th>
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
                const calc = hitungRapor(santri.nilaiJuz || {});
                const colorInfo = PREDIKAT_COLORS[calc.predikatAkhir] || PREDIKAT_COLORS['-'];

                return (
                  <tr key={santri.id}>
                    <td style={{ color: 'var(--slate-400)', fontWeight: 600 }}>{idx + 1}</td>
                    <td className="santri-nis">{santri.nis || santri.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="santri-name">{santri.nama}</span>
                        {currentUser?.role === 'admin' ? (
                          <button
                            type="button"
                            className={`badge-tahsin-toggle ${santri.is_tahsin ? 'active' : 'idle'}`}
                            onClick={() => onToggleTahsin && onToggleTahsin(santri.id, !santri.is_tahsin)}
                            title={santri.is_tahsin ? 'Program Tahsin Aktif (Klik untuk nonaktifkan)' : 'Jadikan Santri Program Tahsin (Klik untuk aktifkan)'}
                          >
                            {santri.is_tahsin ? '✨ Tahsin' : '+ Tahsin'}
                          </button>
                        ) : (
                          santri.is_tahsin && (
                            <span className="badge-tahsin-pill" title="Santri Mengikuti Program Tahsin">
                              ✨ Tahsin
                            </span>
                          )
                        )}
                      </div>
                      {santri.halqah && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          {santri.halqah}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {formatNamaKelas(santri.kelas)}
                      </span>
                    </td>
                    <td>
                      {calc.count > 0 ? (
                        <span style={{ fontWeight: 600, color: '#047857' }}>
                          ✓ {calc.count} Juz
                        </span>
                      ) : (
                        <span style={{ color: 'var(--slate-400)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>
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
                    <td style={{ fontWeight: 700, color: 'var(--slate-700)' }}>
                      {santri.ranking !== '-' ? `#${santri.ranking}` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectInput(santri)}
                          title="Input nilai Juz 1 s/d 30"
                        >
                          <Edit3 size={13} /> Nilai
                        </button>
                        {currentUser?.role === 'admin' ? (
                          <button
                            className="btn btn-gold btn-sm"
                            onClick={() => onSelectPrint && onSelectPrint(santri, santri.ranking)}
                            title="Pratinjau & Cetak E-Rapor format resmi (Khusus Admin)"
                          >
                            <Printer size={13} /> Cetak
                          </button>
                        ) : (
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => onSelectPrint && onSelectPrint(santri, santri.ranking)}
                            title="Lihat Pratinjau Dokumen Rapor"
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

      {/* 2. Tampilan Khusus Mobile: Kartu Santriwati (Tanpa Scroll Horizontal) */}
      <div className="santri-mobile-cards">
        {filteredSantri.length === 0 ? (
          <div className="empty-state-mobile-card">
            Tidak ada santriwati yang sesuai dengan pencarian.
          </div>
        ) : (
          filteredSantri.map((santri, idx) => {
            const calc = hitungRapor(santri.nilaiJuz || {});
            const colorInfo = PREDIKAT_COLORS[calc.predikatAkhir] || PREDIKAT_COLORS['-'];

            return (
              <div key={santri.id} className="santri-mobile-card">
                <div className="mobile-card-header">
                  <div className="mobile-card-identity">
                    <div className="mobile-card-rank">
                      {santri.ranking !== '-' ? `#${santri.ranking}` : `#${idx + 1}`}
                    </div>
                    <div>
                      <div className="mobile-card-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{santri.nama}</span>
                        {currentUser?.role === 'admin' ? (
                          <button
                            type="button"
                            className={`badge-tahsin-toggle ${santri.is_tahsin ? 'active' : 'idle'}`}
                            onClick={() => onToggleTahsin && onToggleTahsin(santri.id, !santri.is_tahsin)}
                            title={santri.is_tahsin ? 'Program Tahsin Aktif (Klik untuk nonaktifkan)' : 'Jadikan Santri Program Tahsin (Klik untuk aktifkan)'}
                          >
                            {santri.is_tahsin ? '✨ Tahsin' : '+ Tahsin'}
                          </button>
                        ) : (
                          santri.is_tahsin && (
                            <span className="badge-tahsin-pill">
                              ✨ Tahsin
                            </span>
                          )
                        )}
                      </div>
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
                    <div className="mobile-stat-label">Hafalan Diuji</div>
                    <div className="mobile-stat-value">
                      {calc.count > 0 ? `${calc.count} Juz` : '—'}
                    </div>
                  </div>
                  <div className="mobile-stat-col">
                    <div className="mobile-stat-label">Rata-rata</div>
                    <div className="mobile-stat-value" style={{ color: calc.count > 0 ? '#15803d' : '#94a3b8' }}>
                      {calc.count > 0 ? calc.rataRata : '—'}
                    </div>
                  </div>
                  <div className="mobile-stat-col">
                    <div className="mobile-stat-label">Ranking</div>
                    <div className="mobile-stat-value" style={{ color: '#d97706' }}>
                      {santri.ranking !== '-' ? `#${santri.ranking}` : '—'}
                    </div>
                  </div>
                </div>

                <div className="mobile-card-actions">
                  <button
                    className="btn btn-secondary btn-mobile-action"
                    onClick={() => onSelectInput(santri)}
                  >
                    <Edit3 size={15} /> Nilai
                  </button>
                  {currentUser?.role === 'admin' ? (
                    <button
                      className="btn btn-gold btn-mobile-action"
                      onClick={() => onSelectPrint && onSelectPrint(santri, santri.ranking)}
                    >
                      <Printer size={15} /> Cetak
                    </button>
                  ) : (
                    <button
                      className="btn btn-info btn-mobile-action"
                      onClick={() => onSelectPrint && onSelectPrint(santri, santri.ranking)}
                    >
                      <Eye size={15} /> Pratinjau
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
