import React, { useState, useMemo } from 'react';
import { Search, Edit3, Printer, Users, Award, BookCheck } from 'lucide-react';
import { hitungRapor, hitungRanking, PREDIKAT_COLORS } from '../utils/tahfidzCalc';

export default function SantriList({ santriList, onSelectInput, onSelectPrint, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState(() => {
    if (currentUser?.role === 'guru' && currentUser?.kelas_binaan && currentUser?.kelas_binaan !== 'Semua') {
      return currentUser.kelas_binaan;
    }
    return 'Semua';
  });

  // Daftar kelas unik dari data santri
  const kelasList = ['Semua', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];

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
      const matchesKelas = selectedKelas === 'Semua' || s.kelas === selectedKelas;
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

        {/* Filter Tombol Kelas Arab */}
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
              {k === 'Semua' ? 'Semua Kelas' : `Kelas ${k}`}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Santri */}
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
                const calc = hitungRapor(santri.nilaiJuz || {});
                const colorInfo = PREDIKAT_COLORS[calc.predikatAkhir] || PREDIKAT_COLORS['-'];

                return (
                  <tr key={santri.id}>
                    <td style={{ color: 'var(--slate-400)', fontWeight: 600 }}>{idx + 1}</td>
                    <td className="santri-nis" style={{ fontWeight: '700', color: '#1e293b' }}>{santri.nis || santri.id}</td>
                    <td>
                      <div className="santri-name">{santri.nama}</div>
                      {santri.halqah && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          {santri.halqah}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="arabic" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {santri.kelas}
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
                        <button
                          className="btn btn-gold btn-sm"
                          onClick={() => onSelectPrint(santri, santri.ranking)}
                          title="Pratinjau & Cetak E-Rapor format resmi"
                        >
                          <Printer size={13} /> Cetak
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
